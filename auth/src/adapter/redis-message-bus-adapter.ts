import { Redis } from 'ioredis';

import { MessageBus } from '../api/interfaces/message-bus';
import { Logger } from '../api/services/logger';

export class RedisMessageBusAdapter extends MessageBus {
    private _messageBus: Redis;

    public constructor() {
        super();
        this.init();
    }

    public async sendEvent(topic: string, field: string, value: string): Promise<void> {
        await this._messageBus.xadd(topic, '*', field, value);
    }

    private init(): void {
        if (!process.env.MESSAGE_BUS_PORT || !process.env.MESSAGE_BUS_HOST) {
            throw new Error('No message bus is defined.');
        }
        try {
            const host = process.env.MESSAGE_BUS_HOST;
            const port = parseInt(process.env.MESSAGE_BUS_PORT, 10);
            Logger.log(`Message bus: ${host}:${port}`);
            this._messageBus = new Redis(port, host);
        } catch (e) {
            Logger.log('Error while connecting to the message-bus:', e);
        }
    }
}
