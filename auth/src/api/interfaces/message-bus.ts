/**
 * Class-interface to send messages into the message-bus
 */
export abstract class MessageBus {
    public abstract sendEvent(topic: string, value: string): Promise<boolean>;
}
