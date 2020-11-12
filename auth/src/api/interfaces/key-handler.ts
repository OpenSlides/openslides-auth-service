export abstract class KeyHandler {
    public abstract getCookieKey(): string;
    public abstract getTokenKey(): string;
}
