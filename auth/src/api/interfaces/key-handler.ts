export abstract class KeyHandler {
    protected privateTokenKey: string;
    protected privateCookieKey: string;
    protected publicTokenKey: string;
    protected publicCookieKey: string;

    public abstract getPrivateTokenKey(): string;
    public abstract getPrivateCookieKey(): string;
    public abstract getPublicTokenKey(): string;
    public abstract getPublicCookieKey(): string;
}
