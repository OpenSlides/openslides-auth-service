import { Redis } from 'ioredis';

export class FakeRedisAdapter {
    private readonly redisPort = parseInt(process.env.CACHE_PORT || '', 10) || 6379;
    private readonly redisHost = process.env.CACHE_HOST || '';
    private database: Redis;

    public end(): void {
        this.database.disconnect();
    }

    public async flushdb(): Promise<void> {
        await this.database.flushdb();
    }

    public async init(): Promise<void> {
        if (this.database) {
            return;
        }
        try {
            this.database = new Redis(this.redisPort, this.redisHost);
            await this.flushdb();
        } catch (e) {
            console.log('Database is not available.');
        }
    }
}
