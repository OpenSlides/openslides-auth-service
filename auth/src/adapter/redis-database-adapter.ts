import Redis from 'redis';

import { Database } from '../api/interfaces/database';
import { Constructable } from '../util/di';

@Constructable(Database)
export class RedisDatabaseAdapter extends Database {
    public name = 'RedisDatabaseAdapter';

    private readonly redisPort = parseInt(process.env.STORAGE_PORT || '', 10) || 6379;
    private readonly redisHost = process.env.STORAGE_HOST || '';
    private readonly database: Redis.RedisClient;

    /**
     * Constructor.
     *
     * Initialize the database and redis commands declared above, if the database is not already initialized.
     */
    public constructor(public readonly modelConstructor: new <T>(...args: any) => T) {
        super();
        if (!this.database) {
            this.database = Redis.createClient({ port: this.redisPort, host: this.redisHost });
            this.clear();
        }
    }

    /**
     * Function to write a key/value-pair to the database. If the key is already existing, it will do nothing.
     *
     * @param key The key, where the object is found.
     * @param obj The object to store.
     *
     * @returns A boolean, if everything is okay - if `false`, the key is already existing in the database.
     */
    public async set<T>(prefix: string, key: string, obj: T): Promise<boolean> {
        const successful = await new Promise((resolve, reject) => {
            this.database.setnx(this.getPrefixedKey(prefix, key), JSON.stringify(obj), (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result);
            });
        });
        return successful === 1;
    }

    /**
     * This returns an object stored by the given key.
     *
     * @param key The key, where the object will be found.
     *
     * @returns The object - if there is no object stored by this key, it will return an empty object.
     */
    public async get<T>(prefix: string, key: string): Promise<T | null> {
        return new Promise((resolve, reject) => {
            this.database.get(this.getPrefixedKey(prefix, key), (error, result = '') => {
                if (error) {
                    reject(error);
                }
                const parsedObject = new this.modelConstructor<T>();
                resolve(parsedObject);
            });
        });
    }

    /**
     * This will delete an entry from the database.
     *
     * @param key The key of the related object to remove.
     *
     * @returns A boolean if the object was successfully deleted.
     */
    public async remove(prefix: string, key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.del([this.getPrefixedKey(prefix, key)], (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result === 1);
            });
        });
    }

    /**
     * Function to get all objects from the database stored by a specific prefix.
     *
     * @param prefix The known name for the storage of the requested objects.
     *
     * @returns An array with all found objects for the specific prefix.
     */
    public async getAll<T>(prefix: string): Promise<T[]> {
        return await new Promise(async (resolve, reject) => {
            this.database.scan('0', async (error, [value, results]) => {
                if (error) {
                    reject(error);
                }
                const objects: T[] = [];
                for (const result of results) {
                    const obj = await this.get<T>(prefix, result.split(':')[2]);
                    if (obj) {
                        objects.push(obj);
                    }
                }
                resolve(objects);
            });
        });
    }

    /**
     * Clears the whole database.
     *
     * Necessary for development to avoid inserting a new entry every refresh.
     */
    protected async clear(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.flushdb((error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(!!result);
            });
        });
    }

    private getPrefixedKey(prefix: string, key: string): string {
        return `auth:${prefix}:${key}`;
    }
}
