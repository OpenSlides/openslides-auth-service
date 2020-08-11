import Redis from 'redis';

import { Database } from '../api/interfaces/database';
import { Logger } from '../api/services/logger';

export class RedisDatabaseAdapter extends Database {
    private readonly redisPort = parseInt(process.env.CACHE_PORT || '', 10) || 6379;
    private readonly redisHost = process.env.CACHE_HOST || '';
    private database: Redis.RedisClient;

    /**
     * Constructor.
     *
     * Initialize the database and redis commands declared above, if the database is not already initialized.
     */
    public constructor(public readonly modelConstructor: new <T>(...args: any) => T) {
        super();
        this.init();
    }

    public async keys(prefix: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.database.sinter(`${this.getPrefix(prefix)}:index`, (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });
    }

    public async set<T>(prefix: string, key: string, obj: T): Promise<boolean> {
        const successful = await new Promise((resolve, reject) => {
            this.database.setnx(this.getPrefixedKey(prefix, key), JSON.stringify(obj), (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
        await new Promise((resolve, reject) => {
            this.database.sadd(`${this.getPrefix(prefix)}:index`, key, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
        this.keys(prefix).then(answer => Logger.log('All keys: ', answer));
        return successful === 1;
    }

    public async get<T>(prefix: string, key: string): Promise<T | null> {
        return new Promise((resolve, reject) => {
            this.database.get(this.getPrefixedKey(prefix, key), (error, result) => {
                if (error) {
                    reject(error);
                }
                const parsedObject = this.modelConstructor
                    ? new this.modelConstructor<T>(result)
                    : JSON.parse(result as string);
                resolve(parsedObject);
            });
        });
    }

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

    public async getAll<T>(prefix: string): Promise<T[]> {
        const keys = await this.keys(prefix);
        return (await Promise.all(keys.map(key => this.get<T>(prefix, key)))) as T[];
    }

    public async findAllByValue(prefix: string, value: string): Promise<string[]> {
        const keys = await this.keys(prefix);
        const result = [];
        for (const key of keys) {
            if ((await this.get(prefix, key)) === value) {
                result.push(key);
            }
        }
        return result;
    }

    public async removeAllByFn(prefix: string, fn: (key: string, value: string) => boolean): Promise<boolean> {
        for (const key of await this.keys(prefix)) {
            const value = await this.get<string>(prefix, key);
            if (value && fn(key, value)) {
                await this.remove(prefix, key);
            }
        }
        return true;
    }

    private init(): void {
        if (this.database) {
            return;
        }
        try {
            this.database = Redis.createClient({ port: this.redisPort, host: this.redisHost });
        } catch (e) {
            Logger.log('Database is not available.');
        }
    }

    private getPrefix(prefix: string): string {
        return `auth:${prefix}`;
    }

    private getPrefixedKey(prefix: string, key: string): string {
        return `${this.getPrefix(prefix)}:${key}`;
    }
}
