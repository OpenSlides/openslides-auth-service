import Redis from 'redis';

import { BaseModel } from '../../core/base/base-model';
import { DatabasePort } from '../interfaces/database-port';
import { Constructable, Inject } from '../../core/modules/decorators';
import { ModelConstructorInterface, ModelConstructorService } from '../../model-services/model-constructor';

@Constructable(DatabasePort)
export default class DatabaseAdapter implements DatabasePort {
    public name = 'DatabaseAdapter';

    private readonly redisPort = parseInt(process.env.STORAGE_PORT || '', 10) || 6379;
    private readonly redisHost = process.env.STORAGE_HOST || '';
    private readonly database: Redis.RedisClient;

    @Inject(ModelConstructorInterface)
    private modelConstructor: ModelConstructorService;

    // Redis commands
    private redisSet: <T>(key: string, value: T) => Promise<boolean>;
    private redisGet: <T>(key: string) => Promise<T>;
    private redisGetAll: <T>(get: (key: string) => Promise<BaseModel>, pattern?: string) => Promise<T[]>;
    private redisDelete: (key: string) => Promise<boolean>;

    /**
     * Constructor.
     *
     * Initialize the database and redis commands declared above, if the database is not already initialized.
     */
    public constructor() {
        if (!this.database) {
            this.database = Redis.createClient({ port: this.redisPort, host: this.redisHost });
            this.initializeRedisCommands();
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
        console.log('set an obj', obj);
        if (!(await this.get(prefix, key))) {
            await this.redisSet(this.getPrefixedKey(prefix, key), obj);
            return true;
        } else {
            return false;
        }
    }

    /**
     * This returns an object stored by the given key.
     *
     * @param key The key, where the object will be found.
     *
     * @returns The object - if there is no object stored by this key, it will return an empty object.
     */
    public async get<T>(prefix: string, key: string): Promise<T | null> {
        return this.redisGet(this.getPrefixedKey(prefix, key));
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
    public async update<T>(prefix: string, key: string, update: Partial<T>): Promise<T> {
        const object = await this.get<T>(prefix, key);
        if (object) {
            Object.assign(object, update);
            this.redisSet(key, object);
            return object;
        } else {
            await this.set(prefix, key, update);
            return update as T;
        }
    }

    /**
     * This will delete an entry from the database.
     *
     * @param key The key of the related object to remove.
     *
     * @returns A boolean if the object was successfully deleted.
     */
    public async remove(prefix: string, key: string): Promise<boolean> {
        return await this.redisDelete(this.getPrefixedKey(prefix, key));
    }

    /**
     * Function to get all objects from the database stored by a specific prefix.
     *
     * @param prefix The known name for the storage of the requested objects.
     *
     * @returns An array with all found objects for the specific prefix.
     */
    public async getAll<T>(prefix: string): Promise<T[]> {
        return this.redisGetAll<T>((key: string) => this.redisGet<BaseModel>(key), prefix);
    }

    /**
     * This function creates a promisified version of redis commands, like set, get, delete.
     */
    private initializeRedisCommands(): void {
        this.redisSet = <T>(key: string, value: T): Promise<boolean> => {
            return new Promise((resolve, reject) => {
                this.database.set(key, JSON.stringify(value), (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(result === 'OK');
                });
            });
        };

        this.redisGet = <T>(key: string): Promise<T> => {
            return new Promise((resolve, reject) => {
                this.database.get(key, (error, result = '') => {
                    if (error) {
                        reject(error);
                    }
                    const parsedObject = JSON.parse(result);
                    resolve(parsedObject);
                });
            });
        };

        this.redisGetAll = <T>(get: (key: string) => Promise<BaseModel>, pattern: string = ''): Promise<T[]> => {
            return new Promise((resolve, reject) => {
                this.database.keys(`${pattern}*`, async (error, results = []) => {
                    if (error) {
                        reject(error);
                    }
                    const parsedObjects: T[] = [];
                    for (const result of results) {
                        const object = (await get(result)) as BaseModel<T>;
                        // parsedObjects.push(await get(result));
                        // tslint:disable-next-line:no-non-null-assertion
                        const constructor = this.modelConstructor.getModelConstructor<T>(object.collectionString)!;
                        console.log('constructor', constructor);
                        // const model = constructor ? new constructor(object) : null;
                        const model = new constructor(object);
                        parsedObjects.push(model);
                    }
                    resolve(parsedObjects);
                });
            });
        };

        this.redisDelete = (key: string): Promise<boolean> => {
            return new Promise((resolve, reject) => {
                this.database.del([key], (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(result === 1);
                });
            });
        };
    }

    private getPrefixedKey(prefix: string, key: string): string {
        return prefix + '_' + key;
    }
}
