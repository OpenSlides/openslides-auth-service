import { Config } from '../../config';
import { SecretException } from '../../core/exceptions/secret-exception';
import { SecretHandler } from '../interfaces/secret-handler';
import { Logger } from './logger';
import fs from 'fs';

const AUTH_DEV_TOKEN_SECRET = 'auth-dev-token-key';
const AUTH_DEV_COOKIE_SECRET = 'auth-dev-cookie-key';
const INTERNAL_AUTH_PASSWORD_DEV = 'openslides';

export class SecretService extends SecretHandler {
    protected tokenSecret = '';
    protected cookieSecret = '';
    protected internalAuthPassword = '';

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

    public getInternalAuthPassword(): string {
        return this.internalAuthPassword;
    }

    private loadSecrets(): void {
        Logger.debug('SecretService.loadSecrets -- is in dev-mode:', Config.isDevMode());
        if (Config.isDevMode()) {
            this.tokenSecret = AUTH_DEV_TOKEN_SECRET;
            this.cookieSecret = AUTH_DEV_COOKIE_SECRET;
            this.internalAuthPassword = INTERNAL_AUTH_PASSWORD_DEV;
        } else {
            const tokenSecretPath = '/run/secrets/auth_token_key';
            this.tokenSecret = this.readFile(tokenSecretPath);
            if (!this.tokenSecret) {
                throw new SecretException(`No AUTH_TOKEN_SECRET defined in ${tokenSecretPath}`);
            }
            const cookieSecretPath = '/run/secrets/auth_cookie_key';
            this.cookieSecret = this.readFile(cookieSecretPath);
            if (!this.cookieSecret) {
                throw new SecretException(`No AUTH_COOKIE_SECRET defined in ${cookieSecretPath}`);
            }
            const internalAuthPasswordPath = '/run/secrets/internal_auth_password';
            const internalAuthPassword = this.readFile(internalAuthPasswordPath);
            if (!internalAuthPassword) {
                throw new SecretException(`No INTERNAL_AUTH_PASSWORD defined in ${internalAuthPasswordPath}`);
            }
            this.internalAuthPassword = Buffer.from(internalAuthPassword).toString('base64');
        }
    }

    private readFile(path: string): string {
        return fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
    }
}
