import { Redis } from 'ioredis';

import { RedisDatabase, KeyType } from '../api/interfaces/redis-database';
import { Logger } from '../api/services/logger';
import { Config } from '../config';

export class RedisDatabaseAdapter extends RedisDatabase {
    private _database: Redis;

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
        return await this._database.smembers(`${this.getPrefix()}:index`);
    }

    public async set<T>(key: KeyType, obj: T, expire: boolean = false): Promise<void> {
        const redisKey = this.getPrefixedKey(key);
        await this._database.hset(this.getHashKey(), redisKey, JSON.stringify(obj));
        if (expire) {
            // just to be sure, multiple timeout by 1.1 to avoid timing issues
            await this._database.expire(redisKey, Config.TOKEN_EXPIRATION_TIME * 1.1);
        } else {
            await this._database.sadd(`${this.getPrefix()}:index`, key);
        }
    }

    public async get<T>(key: KeyType): Promise<T> {
        const result = await this._database.hget(this.getHashKey(), this.getPrefixedKey(key));
        if (result) {
            return this.modelConstructor ? new this.modelConstructor<T>(result) : (JSON.parse(result) as T);
        } else {
            return result as T;
        }
    }

    public async remove(key: KeyType): Promise<boolean> {
        const deleted = await this._database.hdel(this.getHashKey(), this.getPrefixedKey(key));
        const removed = await this._database.srem(`${this.getPrefix()}:index`, key);
        return deleted === 1 && removed === 1;
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
        return this.getPrefix();
    }

    private getPrefix(): string {
        return `${RedisDatabase.PREFIX}:${this.prefix}`;
    }

    private getPrefixedKey(key: KeyType): string {
        return `${this.getPrefix()}:${key}`;
    }
}
