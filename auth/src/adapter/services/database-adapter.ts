// import Redis from 'ioredis';
import Redis from 'redis';

import { DatabasePort } from '../interfaces/database-port';
import { Injectable } from '../../core/modules/decorators';

@Injectable(DatabasePort)
export default class DatabaseAdapter implements DatabasePort {
    private readonly redisPort = parseInt(process.env.STORAGE_PORT || '', 10) || 6379;
    private readonly redisHost = process.env.STORAGE_HOST || '';

    public name = 'DatabaseAdapter';

    // private database: Redis.Redis = new Redis(DatabaseAdapter.redisPort, DatabaseAdapter.redisHost);
    // private readonly database: Redis.Redis;
    private database: Redis.RedisClient;

    public constructor() {
        this.database = Redis.createClient();
        console.log('database', this.redisHost, this.redisPort);
    }

    /**
     * Function to write a key/value-pair to the database. If the key is already existing, it will do nothing.
     *
     * @param key The key, where the object is found.
     * @param obj The object to store.
     *
     * @returns A boolean, if everything is okay - if `false`, the key is already existing in the database.
     */
    public async set<T>(key: string, obj: T): Promise<boolean> {
        // if (await this.database.get(key)) {
        //     await this.database.set(key, JSON.stringify(obj));
        //     return true;
        // } else {
        //     return false;
        // }
        return true;
    }

    /**
     * This returns an object stored by the given key.
     *
     * @param key The key, where the object will be found.
     *
     * @returns The object - if there is no object stored by this key, it will return an empty object.
     */
    public async get<T>(key: string): Promise<T> {
        // console.log('database get', this.database);
        // const obj = (await this.database.get(key)) || JSON.stringify({});
        // return JSON.parse(obj) as T;
        return {} as T;
    }

    /**
     * This function will update an existing object in the database by the given object.
     * to the database, no matter if there is already an object stored
     * by the given key.
     *
     * @param key The key, where the object is found.
     * @param update The object or partially properties, which are assigned to the original object
     * found by the given key.
     *
     * @returns The updated object.
     */
    public async update<T>(key: string, update: Partial<T>): Promise<T> {
        // const object = await this.get<T>(key);
        // Object.assign(object, update);
        // this.database.set(key, JSON.stringify(object));
        // return object;
        return {} as T;
    }

    /**
     * This will delete an entry from the database.
     *
     * @param key The key of the related object to remove.
     *
     * @returns A boolean if the object was successfully deleted.
     */
    public async remove(key: string): Promise<boolean> {
        // const removed = await this.database.del(key);
        // return removed === 1;
        return true;
    }
}
