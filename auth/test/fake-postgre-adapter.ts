import { Client } from 'pg';

const ALL_TABLES = [
    'user_t',
];

const ALL_SEQUENCES = ['positions_position', 'events_id', 'collectionfields_id'];

export class FakePostgreAdapter {
    private _client: Client;
    private static _instance: FakePostgreAdapter;

    public async ready(): Promise<void> {
        if (!this._client) {
            this._client = await this.initClient();
        }
    }

    public async prune(): Promise<void> {
        try {
            const client = await this.getClient();
            for (const table of ALL_TABLES) {
                await client.query(`DELETE FROM ${table} CASCADE;`, []);
                await client.query(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`, []);
            }
        } catch (e: any) {
            console.log('Error prune', e.stack);
        }
    }

    public static getInstance(): FakePostgreAdapter {
        if (!this._instance) {
            this._instance = new FakePostgreAdapter();
        }
        return this._instance;
    }

    public async closeConnection(): Promise<void> {
        await this._client.end();
    }

    private async initClient(): Promise<Client> {
        const client = new Client({
            host: 'postgres',
            database: 'openslides',
            user: 'openslides',
            password: 'openslides'
        });
        await client.connect();
        const result = await this.doHandle(client.query('select version();'));
        console.log(`Connection to database successfully!\nDatabase version:`, result.rows);
        return client;
    }

    private async getClient(): Promise<Client> {
        let client: Client;
        if (!this._client) {
            client = new Client({
                host: 'postgres',
                database: 'openslides',
                user: 'openslides',
                password: 'openslides'
            });
            await client.connect();
            const result = await client.query('select version();');
            console.log(`Connection to database successfully!\nDatabase version:`, result.rows);
            this._client = client;
        }
        return this._client;
    }

    private async doHandle(promise: Promise<any>): Promise<any> {
        let result: any;
        try {
            result = await promise;
        } catch (e) {
            console.log('An error occurred', e);
            result = null;
        }
        return result;
    }
}
