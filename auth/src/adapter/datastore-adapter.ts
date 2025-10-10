import { Pool, PoolClient } from 'pg';
import { Logger } from 'src/api/services/logger';
import { Config } from 'src/config';
import { BaseModel } from 'src/core/base/base-model';

import { Datastore, EventType, GetManyAnswer, WriteRequest } from '../api/interfaces/datastore';
import { Id } from '../core/key-transforms';


export class DatastoreAdapter extends Datastore {

    private _pool: Pool

    public constructor() {
        super()

        try {
            if (!Config.isDevMode()) {
                throw Error('Prod postgres password code not implemented.');
            }
            const password = 'openslides';
            this._pool = new Pool({
                host: Config.DATABASE_HOST,
                port: Config.DATABASE_PORT,
                database: Config.DATABASE_NAME,
                user: Config.DATABASE_USER,
                password,
                min:Config.DB_POOL_MIN_SIZE,
                max:Config.DB_POOL_MAX_SIZE,
                idleTimeoutMillis: Config.DB_IDLE_TIMEOUT,
                connectionTimeoutMillis: Config.DB_CONNECTION_TIMEOUT,
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
            this._pool.on('error', (err) => {
                Logger.error('PostgreSQL pool error:', err);
            });
            Logger.debug('PostgreSQL pool initialized.')
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
            return this.replaceDbTimestamps(result.rows[0]) as T
        } finally {
            client.release()
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
                answer[(row as {[key:string]:any}).id as number] = this.replaceDbTimestamps(row) as T;
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
                if (event.type === EventType.UPDATE) {
                    const [collection, id]: [string, string] = event.fqid.split('/') as  [string, string];
                    if (collection === 'user') {
                        await this.updateUser(client, parseInt(id, 10), event.fields);
                    } else {
                        // No need to write into any collection, except user.
                        Logger.debug(`Unsupported collection for write: ${collection}`);
                    }
                } else {
                    Logger.debug(`Unsupported event type: ${event.type}`);
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

    private replaceDbTimestamps(row: {[key:string]:any}): {[key:string]:any} {
        for (const [key, val] of Object.entries(row)) {
            if (val instanceof Date) {
                row[key] = Math.floor(val.getTime() / 1000)
            }
        }
        return row
    }

    private async updateUser(client: PoolClient, userId: number, fields: { [key: string]: unknown }): Promise<void> {
        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        for (const [field, value] of Object.entries(fields)) {
            if (field) {
                updates.push(`${field} = $${paramIndex}`);

                // Handle last_login timestamp conversion
                if (field === 'last_login' && typeof value === 'number') {
                    values.push(new Date(value * 1000).toISOString());
                } else {
                    values.push(value);
                }
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            Logger.debug('No valid fields to update');
            return;
        }

        values.push(userId);
        const query = `UPDATE user_t SET ${updates.join(', ')} WHERE id = $${paramIndex}`;

        await client.query(query, values);
        Logger.debug(`Updated user ${userId} with fields:`, fields);
    }
}
