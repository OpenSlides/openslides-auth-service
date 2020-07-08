import { InjectableClass } from '../../util/di';

export abstract class KeyHandler extends InjectableClass {
    protected privateTokenKey: string;
    protected privateCookieKey: string;
    protected publicTokenKey: string;
    protected publicCookieKey: string;

    public abstract getPrivateTokenKey(): string;
    public abstract getPrivateCookieKey(): string;
    public abstract getPublicTokenKey(): string;
    public abstract getPublicCookieKey(): string;
}
