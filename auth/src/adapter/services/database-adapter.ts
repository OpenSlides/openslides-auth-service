import pouchdb from 'pouchdb';

import Client from '../../core/models/client';
import { DATABASE_PATH } from '../../config';
import { DatabasePort } from '../interfaces/database-port';
import { Injectable } from '../../core/modules/decorators';

@Injectable(DatabasePort)
export default class DatabaseAdapter implements DatabasePort {
    public name = 'DatabaseAdapter';

    // private static instance: DatabaseAdapter;
    private database: PouchDB.Database;

    public constructor() {
        this.database = new pouchdb(DATABASE_PATH + 'UserDatabase');
    }

    public addClient(client: object): void {
        this.database.post(client).then(response => console.log('response:', response));
    }

    public setRefreshToken(token: any, user: Client): void {
        // this.database.put()
    }

    public async getClientByName(name: string): Promise<Client> {
        const { rows: allUsers } = await this.database.allDocs({ include_docs: true });
        return new Promise(resolve => {
            return new Client();
        });
    }
}
