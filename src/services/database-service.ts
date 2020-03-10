import pouchdb from 'pouchdb';

export default class DatabaseService {
    private static instance: DatabaseService;
    private database: PouchDB.Database;

    private constructor() {
        this.database = new pouchdb('UserDatabase');
    }

    public static getInstance(): DatabaseService {
        if (this.instance === null) {
            this.instance = new DatabaseService();
        }
        return this.instance;
    }

    public add(user: object): void {
        this.database.put(user);
    }
}
