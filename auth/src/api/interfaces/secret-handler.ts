export abstract class SecretHandler {
    public abstract getCookieSecret(): string;
    public abstract getTokenSecret(): string;
}
