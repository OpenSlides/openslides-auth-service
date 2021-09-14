/**
 * Class-interface to send messages into the message-bus
 */
export abstract class MessageBus {
    public abstract sendEvent(topic: string, field: string, value: string): Promise<void>;
}
