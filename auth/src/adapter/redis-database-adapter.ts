import Redis from 'ioredis';

import { Database } from '../api/interfaces/database';
import { Logger } from '../api/services/logger';

export class RedisDatabaseAdapter extends Database {
    private readonly redisPort = parseInt(process.env.CACHE_PORT || '', 10) || 6379;
    private readonly redisHost = process.env.CACHE_HOST || '';
    private database: Redis.Redis;

    /**
     * Constructor.
     *
     * Initialize the database and redis commands declared above, if the database is not already initialized.
     */
    public constructor(
        private readonly prefix: string,
        private readonly modelConstructor?: new <T>(...args: any) => T
    ) {
        super();
        this.init();
    }

    public async keys(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.database.smembers(`${this.getPrefix()}:index`, (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });
    }

    public async set<T>(key: string, obj: T): Promise<void> {
        await new Promise((resolve, reject) => {
            this.database.hset(this.getHashKey(), this.getPrefixedKey(key), JSON.stringify(obj), (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
        await new Promise((resolve, reject) => {
            this.database.sadd(`${this.getPrefix()}:index`, key, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            });
        });
    }

    public async get<T>(key: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this.database.hget(this.getHashKey(), this.getPrefixedKey(key), (error, result) => {
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

    public async remove(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.hdel(this.getHashKey(), [this.getPrefixedKey(key)], (error, result) => {
                if (error) {
                    reject(error);
                }
                resolve(result === 1);
            });
        });
    }

    private init(): void {
        if (this.database) {
            return;
        }
        try {
            this.database = new Redis(this.redisPort, this.redisHost);
        } catch (e) {
            Logger.log('Database is not available.');
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
