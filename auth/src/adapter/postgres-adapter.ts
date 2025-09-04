import { readFileSync } from 'fs';
import { Pool, PoolClient } from 'pg';

import { Config } from '../config';
import { Datastore, GetManyAnswer, WriteRequest, EventType } from '../api/interfaces/datastore';
import { Id } from '../core/key-transforms';
import { Logger } from '../api/services/logger';

export class PostgresAdapter extends Datastore {
    private pool: Pool;

    constructor() {
        super();
        this.initializePool();
    }

    private initializePool(): void {
        try {
            const password = readFileSync(Config.DATABASE_PASSWORD_FILE, 'utf8').trim();
            this.pool = new Pool({
                host: Config.DATABASE_HOST,
                port: Config.DATABASE_PORT,
                database: Config.DATABASE_NAME,
                user: Config.DATABASE_USER,
                password: password,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000
            });

            this.pool.on('error', (err: any) => {
                Logger.error('PostgreSQL pool error:', err);
            });

            Logger.debug('PostgreSQL pool initialized');
        } catch (error) {
            Logger.error('Failed to initialize PostgreSQL pool:', error);
            throw error;
        }
    }

    public async get<T>(collection: string, id: Id, mappedFields?: (keyof T)[]): Promise<T> {
        if (collection === 'organization') {
            // Return empty object for organization requests since we don't support SAML yet
            Logger.debug(`Collection '${collection}' is not supported yet - returning empty object`);
            return {} as T;
        }
        if (collection !== 'user') {
            throw new Error(`Collection '${collection}' is not supported`);
        }

        const client = await this.pool.connect();
        try {
            const fields = mappedFields ? mappedFields.join(', ') : '*';
            const query = `SELECT ${fields} FROM user_t WHERE id = $1 AND is_active = true`;
            const result = await client.query(query, [id]);

            if (result.rows.length === 0) {
                return {} as T;
            }

            const user = this.transformUserFromDb(result.rows[0]);
            return user as T;
        } finally {
            client.release();
        }
    }

    public async filter<T>(
        collection: string,
        filterField: keyof T,
        filterValue: string | number,
        mappedFields?: (keyof T)[]
    ): Promise<GetManyAnswer<T>> {
        if (collection === 'organization') {
            // Return empty result for organization requests since we don't support SAML yet
            Logger.debug(`Collection '${collection}' is not supported yet - returning empty result`);
            return {} as GetManyAnswer<T>;
        }
        if (collection !== 'user') {
            throw new Error(`Collection '${collection}' is not supported`);
        }

        const client = await this.pool.connect();
        try {
            const fields = mappedFields ? mappedFields.join(', ') : '*';
            const dbField = this.mapFieldToDbColumn(filterField as string);
            const query = `SELECT ${fields} FROM user_t WHERE ${dbField} = $1 AND is_active = true`;
            const result = await client.query(query, [filterValue]);

            const answer: GetManyAnswer<T> = {};
            for (const row of result.rows) {
                const user = this.transformUserFromDb(row);
                answer[user.id] = user as T;
            }

            return answer;
        } finally {
            client.release();
        }
    }

    public async exists<T>(
        collection: string,
        filterField: keyof T,
        filterValue: string | number
    ): Promise<{ exists: boolean; position: number }> {
        if (collection === 'organization') {
            // Return false for organization existence checks since we don't support SAML yet
            Logger.debug(`Collection '${collection}' is not supported yet - returning false`);
            return { exists: false, position: 0 };
        }
        if (collection !== 'user') {
            throw new Error(`Collection '${collection}' is not supported`);
        }

        const client = await this.pool.connect();
        try {
            const dbField = this.mapFieldToDbColumn(filterField as string);
            const query = `SELECT 1 FROM user_t WHERE ${dbField} = $1 AND is_active = true LIMIT 1`;
            const result = await client.query(query, [filterValue]);

            return {
                exists: result.rows.length > 0,
                position: 0 // Not relevant for direct database access
            };
        } finally {
            client.release();
        }
    }

    public async write(writeRequest: WriteRequest): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            for (const event of writeRequest.events) {
                if (event.type === EventType.UPDATE) {
                    const [collection, id] = event.fqid.split('/');
                    if (collection === 'user') {
                        await this.updateUser(client, parseInt(id, 10), event.fields);
                    } else {
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

    private async updateUser(client: PoolClient, userId: number, fields: { [key: string]: unknown }): Promise<void> {
        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        for (const [field, value] of Object.entries(fields)) {
            const dbColumn = this.mapFieldToDbColumn(field);
            if (dbColumn) {
                updates.push(`${dbColumn} = $${paramIndex}`);

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

    private mapFieldToDbColumn(field: string): string {
        const fieldMapping: { [key: string]: string } = {
            id: 'id',
            username: 'username',
            password: 'password',
            is_active: 'is_active',
            email: 'email',
            last_login: 'last_login',
            saml_id: 'saml_id',
            meta_deleted: '' // This doesn't exist in our Postgres schema, we use is_active instead
        };

        return fieldMapping[field] || field;
    }

    private transformUserFromDb(row: any): any {
        return {
            id: row.id,
            username: row.username,
            password: row.password,
            is_active: row.is_active,
            email: row.email,
            last_login: row.last_login ? Math.floor(new Date(row.last_login).getTime() / 1000) : null,
            saml_id: row.saml_id,
            meta_deleted: !row.is_active // Map is_active to meta_deleted logic
        };
    }

    public async close(): Promise<void> {
        await this.pool.end();
        Logger.debug('PostgreSQL pool closed');
    }
}
