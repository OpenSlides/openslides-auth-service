import { Keys } from '../../config';
import { KeyHandler } from '../interfaces/key-handler';

export class KeyService extends KeyHandler {
    protected privateTokenKey: string;
    protected privateCookieKey: string;
    protected publicTokenKey: string;
    protected publicCookieKey: string;

    public constructor() {
        super();

        // Load key files early to detect missing ones
        this.privateTokenKey = Keys.privateTokenKey();
        this.privateCookieKey = Keys.privateCookieKey();
        this.publicTokenKey = Keys.publicTokenKey();
        this.publicCookieKey = Keys.publicCookieKey();
    }

    public getPrivateTokenKey(): string {
        return this.privateTokenKey;
    }
    public getPrivateCookieKey(): string {
        return this.privateCookieKey;
    }
    public getPublicTokenKey(): string {
        return this.publicTokenKey;
    }
    public getPublicCookieKey(): string {
        return this.publicCookieKey;
    }
}
