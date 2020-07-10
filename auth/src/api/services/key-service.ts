import { Keys } from '../../config';
import { KeyHandler } from '../interfaces/key-handler';

export class KeyService extends KeyHandler {
    public getPrivateTokenKey(): string {
        if (!this.privateTokenKey) {
            this.privateTokenKey = Keys.privateTokenKey();
        }
        return this.privateTokenKey;
    }
    public getPrivateCookieKey(): string {
        if (!this.privateCookieKey) {
            this.privateCookieKey = Keys.privateCookieKey();
        }
        return this.privateCookieKey;
    }
    public getPublicTokenKey(): string {
        if (!this.publicTokenKey) {
            this.publicTokenKey = Keys.publicTokenKey();
        }
        return this.publicTokenKey;
    }
    public getPublicCookieKey(): string {
        if (!this.publicCookieKey) {
            this.publicCookieKey = Keys.publicCookieKey();
        }
        return this.publicCookieKey;
    }
}
