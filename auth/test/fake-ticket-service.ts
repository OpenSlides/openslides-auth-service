import jwt from 'jsonwebtoken';

import { SecretService } from '../src/api/services/secret-service';
import { TokenPayload, Utils } from './utils';

export class FakeTicketService {
    private readonly _secretService = new SecretService();

    public get cookieSecret(): string {
        return this._secretService.getCookieSecret();
    }

    public get tokenSecret(): string {
        return this._secretService.getTokenSecret();
    }

    public getExpiredJwt(oldJwt: string, type: 'cookie' | 'token' = 'token'): string {
        if (oldJwt.startsWith('bearer ')) {
            oldJwt = oldJwt.slice(7);
        }
        const token = this.decode(oldJwt) as TokenPayload;
        const signKey = type === 'token' ? this.tokenSecret : this.cookieSecret;
        const expiredToken = jwt.sign({ exp: new Date(0).getTime(), sessionId: token.sessionId, userId: 1 }, signKey, {
            algorithm: 'HS256'
        });
        return `bearer ${expiredToken}`;
    }

    private decode<T>(token: string): T {
        const parts = token.split('.');
        if (parts.length < 2) {
            throw new Error(`Invalid token to decode: ${token}`);
        }
        return Utils.decodeBase64<T>(parts[1]);
    }
}
