import Redis from 'ioredis';

import { Database } from '../api/interfaces/database';
import { Logger } from '../api/services/logger';

export class RedisDatabaseAdapter extends Database {
    private _database: Redis.Redis;

    /**
     * Constructor.
     *
     * Initialize the database and redis commands declared above, if the database is not already initialized.
     */
    public constructor(
        private readonly prefix: string,
        private readonly modelConstructor?: new <T>(...args: unknown[]) => T
    ) {
        super();
        this.init();
    }

    public async keys(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this._database.smembers(`${this.getPrefix()}:index`, (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });
    }

    public async set<T>(key: string, obj: T): Promise<void> {
        await new Promise((resolve, reject) => {
            this._database.hset(this.getHashKey(), this.getPrefixedKey(key), JSON.stringify(obj), (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
        await new Promise((resolve, reject) => {
            this._database.sadd(`${this.getPrefix()}:index`, key, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
    }

    public async get<T>(key: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this._database.hget(this.getHashKey(), this.getPrefixedKey(key), (error, result) => {
                if (error) {
                    reject(error);
                }
                let parsedObject: T | null = null;
                if (result) {
                    parsedObject = this.modelConstructor
                        ? new this.modelConstructor<T>(result)
                        : (JSON.parse(result) as T);
                }
                resolve(parsedObject as T);
            });
        });
    }

    public async remove(key: string): Promise<boolean> {
        const isDeleted = new Promise<boolean>((resolve, reject) => {
            this._database.hdel(this.getHashKey(), [this.getPrefixedKey(key)], (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result === 1);
            });
        });
        const isRemoved = new Promise<boolean>((resolve, reject) => {
            this._database.srem(`${this.getPrefix()}:index`, key, (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result === 1);
            });
        });
        return (await isDeleted) && (await isRemoved);
    }

    private init(): void {
        if (!process.env.CACHE_PORT || !process.env.CACHE_HOST) {
            throw new Error('No cache is defined.');
        }
        try {
            const host = process.env.CACHE_HOST;
            const port = parseInt(process.env.CACHE_PORT, 10);
            Logger.log(`Database: ${host}:${port}`);
            this._database = new Redis(port, host);
        } catch (e) {
            Logger.log('Error while connecting to the cache:', e);
        }
    }

    private getHashKey(): string {
        return `${Database.PREFIX}:${this.prefix}`;
    }

    private getPrefix(): string {
        return `${Database.PREFIX}:${this.prefix}`;
    }

    private getPrefixedKey(key: string): string {
        return `${this.getPrefix()}:${key}`;
    }
}
