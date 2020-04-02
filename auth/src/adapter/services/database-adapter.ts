import pouchdb from 'pouchdb';

import Client from '../../core/models/client';
import { DATABASE_PATH } from '../../config';
import { Service } from '../../core/modules/decorators';

// @Service('database')
@Service()
export default class DatabaseAdapter {
    // private static instance: DatabaseAdapter;
    private database: PouchDB.Database;

    public constructor() {
        this.database = new pouchdb(DATABASE_PATH + 'UserDatabase');
    }

    // public static getInstance(): DatabaseAdapter {
    //     if (this.instance === null) {
    //         this.instance = new DatabaseAdapter();
    //     }
    //     return this.instance;
    // }

    public addUser(user: object): void {
        this.database.post(user).then(response => console.log('response:', response));
    }

    public getUserById(id: string): any {}

    public async getUserByName(name: string): Promise<any> {
        const { rows: allUsers } = await this.database.allDocs({ include_docs: true });
        // for (const user of allUsers) {
        //     console.log('user: ', user);
        // }
    }

    public setRefreshToken(token: any, user: Client): void {
        // this.database.put()
    }
}
