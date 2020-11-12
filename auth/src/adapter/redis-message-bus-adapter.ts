import Redis from 'ioredis';

import { Logger } from '../api/services/logger';
import { MessageBus } from '../api/interfaces/message-bus';

export class RedisMessageBusAdapter extends MessageBus {
    private messageBus: Redis.Redis;

    public constructor() {
        super();
        this.init();
    }

    private init(): void {
        if (!process.env.MESSAGE_BUS_PORT || !process.env.MESSAGE_BUS_HOST) {
            throw new Error('No message bus is defined.');
        }
        try {
            const host = process.env.MESSAGE_BUS_HOST;
            const port = parseInt(process.env.MESSAGE_BUS_PORT, 10);
            Logger.log(`Message bus: ${host}:${port}`);
            this.messageBus = new Redis(port, host);
        } catch (e) {
            Logger.log('Error while connecting to the message-bus:', e);
        }
    }

    public async sendEvent(topic: string, field: string, value: string): Promise<any> {
        return await this.messageBus.xadd(topic, '*', field, value);
    }
}
