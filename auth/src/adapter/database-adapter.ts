import { Pool, PoolClient } from 'pg';

import { Database, EventType, GetManyAnswer, WriteRequest } from '../api/interfaces/database';
import { Logger } from '../api/services/logger';
import { Config } from '../config';
import { BaseModel, BaseModelType } from '../core/base/base-model';
import { Id } from '../core/key-transforms';
import { readFileSync } from 'fs';

type QueryData = [string[], unknown[], number];

export class DatabaseAdapter extends Database {
    private _pool: Pool;

    public constructor() {
        super();

        try {
            let password: string;
            if (!Config.isDevMode()) {
                password = readFileSync(Config.DATABASE_PASSWORD_FILE, 'utf8').trim();
            } else {
                password = 'openslides';
            }
            this._pool = new Pool({
                host: Config.DATABASE_HOST,
                port: Config.DATABASE_PORT,
                database: Config.DATABASE_NAME,
                user: Config.DATABASE_USER,
                password,
                min: Config.DB_POOL_MIN_SIZE,
                max: Config.DB_POOL_MAX_SIZE,
                idleTimeoutMillis: Config.DB_IDLE_TIMEOUT,
                connectionTimeoutMillis: Config.DB_CONNECTION_TIMEOUT
                // connectionString:
                // keepAlive:
                // stream:
                // statement_timeout:
                // ssl:
                // lock_timeout:
                // keepAliveInitialDelayMillis:
                // idle_in_transaction_session_timeout:
                // application_name:
                // fallback_application_name:
                // types:
                // options:
                // client_encoding:
                // maxLifetimeSeconds:

                // log:
                // Promise:
                // allowExitOnIdle:
                // maxUses:
                // Client:
            });
            this._pool.on('error', err => {
                Logger.error('PostgreSQL pool error:', err);
            });
            Logger.debug('PostgreSQL pool initialized.');
        } catch (error) {
            Logger.error('Failed to initialize PostgreSQL pool:', error);
            throw error;
        }
    }

    public async get<T extends BaseModel>(collection: string, id: Id, mappedFields?: (keyof T)[]): Promise<T> {
        const client = await this._pool.connect();
        try {
            const fields = mappedFields ? mappedFields.join(', ') : '*';
            const query = `SELECT ${fields} FROM ${collection}_t WHERE id = $1`;
            const result = await client.query(query, [id]);
            if (result.rows.length === 0) {
                return {} as T;
            }
            return this.replaceDbTimestamps(result.rows[0]) as T;
        } finally {
            client.release();
        }
    }

    public async filter<T extends BaseModel>(
        collection: string,
        filterField: keyof T,
        filterValue: string | number,
        mappedFields?: (keyof T)[]
    ): Promise<GetManyAnswer<T>> {
        const client = await this._pool.connect();
        try {
            const fields = mappedFields ? mappedFields.join(', ') : '*';
            const query = `SELECT ${fields} FROM ${collection}_t WHERE ${filterField as string} = $1`;
            const result = await client.query(query, [filterValue]);

            const answer: GetManyAnswer<T> = {};
            for (const row of result.rows) {
                answer[(row as BaseModelType).id as number] = this.replaceDbTimestamps(row) as T;
            }

            return answer;
        } finally {
            client.release();
        }
    }

    public async write(writeRequest: WriteRequest): Promise<void> {
        const client = await this._pool.connect();
        try {
            await client.query('BEGIN');

            for (const event of writeRequest.events) {
                const [collection, id]: [string, string] = event.fqid.split('/') as [string, string];
                switch (event.type) {
                    case EventType.UPDATE:
                        const updateData = this.getQueryData(collection, event.fields);
                        if (updateData) {
                            await this.updateModel(client, collection, parseInt(id, 10), event.fields, updateData);
                        }
                        break;
                    case EventType.CREATE:
                        delete event.fields['id'];
                        const createData = this.getQueryData(collection, event.fields);
                        if (createData) {
                            await this.createModel(client, collection, parseInt(id, 10), event.fields, createData);
                        }
                        break;
                    default:
                        Logger.debug('Unsupported event type'); // : ${event.type}`);
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            Logger.error('Write operation failed:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    public async close(): Promise<void> {
        await this._pool.end();
        Logger.debug('PostgreSQL pool closed');
    }

    private replaceDbTimestamps(row: BaseModelType): object {
        for (const [key, val] of Object.entries(row)) {
            if (val instanceof Date) {
                row[key] = Math.floor(val.getTime() / 1000);
            }
        }
        return row;
    }

    private getQueryData(collection: string, fields: { [key: string]: unknown }): QueryData | undefined {
        if (collection === 'user') {
            return this.getUserQueryData(fields);
        } else {
            // No need to write into any collection, except user.
            Logger.debug(`Unsupported collection for write: ${collection}`);
            return undefined;
        }
    }

    private getUserQueryData(fields: { [key: string]: unknown }): QueryData {
        const selectors: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        for (const [field, value] of Object.entries(fields)) {
            if (field) {
                selectors.push(`${field} = $${paramIndex}`);

                // Handle last_login timestamp conversion
                if (field === 'last_login' && typeof value === 'number') {
                    values.push(new Date(value * 1000).toISOString());
                } else {
                    values.push(value);
                }
                paramIndex++;
            }
        }
        return [selectors, values, paramIndex];
    }

    private async updateModel(
        client: PoolClient,
        collection: string,
        id: number,
        fields: { [key: string]: unknown },
        queryData: QueryData
    ): Promise<void> {
        const [selectors, values, paramIndex]: QueryData = queryData;
        if (selectors.length === 0) {
            Logger.debug('No valid fields to update');
            return;
        }

        values.push(id);
        const query = `UPDATE ${collection}_t SET ${selectors.join(', ')} WHERE id = $${paramIndex}`;

        await client.query(query, values);
        Logger.debug(`Updated ${collection} ${id} with fields:`, fields);
    }

    private async createModel(
        client: PoolClient,
        collection: string,
        id: number,
        fields: { [key: string]: unknown },
        queryData: QueryData
    ): Promise<void> {
        const [selectors, values]: QueryData = queryData;

        const fieldNameList = selectors.map(date => date.split(' = ')[0]);
        const standinList = selectors.map(date => date.split(' = ')[1]);
        const fieldNames = fieldNameList.join(', ');
        const standins = standinList.join(', ');

        const query = `INSERT INTO ${collection}_t (${fieldNames}) VALUES (${standins})`;

        await client.query(query, values);
    }
}
