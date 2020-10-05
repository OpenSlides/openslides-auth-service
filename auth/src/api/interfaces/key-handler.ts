export abstract class KeyHandler {
    public abstract getPrivateTokenKey(): string;
    public abstract getPrivateCookieKey(): string;
    public abstract getPublicTokenKey(): string;
    public abstract getPublicCookieKey(): string;
}
