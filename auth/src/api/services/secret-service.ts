import { Config } from '../../config';
import { SecretException } from '../../core/exceptions/secret-exception';
import { SecretHandler } from '../interfaces/secret-handler';
import { Logger } from './logger';
import fs from 'fs';

const AUTH_DEV_TOKEN_SECRET = 'auth-dev-token-key';
const AUTH_DEV_COOKIE_SECRET = 'auth-dev-cookie-key';

export class SecretService extends SecretHandler {
    protected tokenSecret = '';
    protected cookieSecret = '';

    public constructor() {
        super();
        // Load key files early to detect missing ones
        this.loadSecrets();
    }

    public getCookieSecret(): string {
        return this.cookieSecret;
    }

    public getTokenSecret(): string {
        return this.tokenSecret;
    }

    private loadSecrets(): void {
        Logger.debug('SecretService.loadSecrets -- is in dev-mode:', Config.isDevMode());
        if (Config.isDevMode()) {
            this.tokenSecret = AUTH_DEV_TOKEN_SECRET;
            this.cookieSecret = AUTH_DEV_COOKIE_SECRET;
        } else {
            this.tokenSecret = this.getSecret('AUTH_TOKEN_KEY_FILE', '/run/secrets/auth_token_key');
            this.cookieSecret = this.getSecret('AUTH_COOKIE_KEY_FILE', '/run/secrets/auth_cookie_key');
        }
    }

    private getSecret(envVar: string, defaultValue: string): string {
        const path = process.env[envVar] || defaultValue;
        if (!path) {
            throw new SecretException(`${envVar} is not defined.`);
        }
        const secret = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
        if (!secret) {
            throw new SecretException(`No secret defined in ${path} (${envVar})`);
        }
        return path;
    }
}
