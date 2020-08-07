import Redis from 'ioredis';

import { Logger } from '../api/services/logger';
import { MessageBus } from '../api/interfaces/message-bus';

export class RedisMessageBusAdapter extends MessageBus {
    private messageBus: Redis.Redis;

    public constructor() {
        super();
        this.init();
    }

    public async sendEvent(topic: string, value: string): Promise<boolean> {
        return await new Promise((resolve, reject) => {
            this.messageBus.xadd(topic, value, (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result === 'OK');
            });
        });
    }

    private init(): void {
        if (!process.env.MESSAGE_BUS_PORT || !process.env.MESSAGE_BUS_HOST) {
            throw new Error('No message bus is defined.');
        }
        try {
            const redisPort = parseInt(process.env.MESSAGE_BUS_PORT, 10);
            const redisHost = process.env.MESSAGE_BUS_HOST;
            this.messageBus = new Redis(redisPort, redisHost);
        } catch (e) {
            Logger.log('Error while connecting to the message-bus:', e);
        }
    }
}
