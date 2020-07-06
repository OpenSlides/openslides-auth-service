import { exception } from 'console';
import jwt from 'jsonwebtoken';

import { Keys } from '../../config';
import { cryptoKey } from '../../util/helper';
import { Cookie, Ticket, Token } from '../../core/ticket';
import { TokenHandler } from '../interfaces/token-handler';
import { User } from '../../core/models/user/user';

export class TokenService implements TokenHandler {
    public name = 'TokenHandler';

    public static verifyCookie(cookieAsString: string): Cookie {
        try {
            return jwt.verify(cookieAsString, Keys.privateCookieKey()) as Cookie;
        } catch {
            throw exception('Wrong cookie');
        }
    }

    public static verifyToken(tokenAsString: string): Token {
        try {
            return jwt.verify(tokenAsString, Keys.privateKey()) as Token;
        } catch {
            throw exception('Wrong token');
        }
    }

    public static decode<T>(tokenString: string): T {
        const parts = tokenString.split('.');
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload) as T;
    }

    public async create(user: User): Promise<Ticket> {
        if (!Object.keys(user).length) {
            throw new Error('user is empty.');
        }
        const sessionId = cryptoKey(32);
        user.setSession(sessionId);
        const cookie = this.generateCookie(sessionId);
        const token = this.generateToken(sessionId, user);
        return { cookie, token, user };
    }

    public async refresh(cookie: string, sessionId: string, user: User): Promise<Ticket> {
        try {
            const token = this.generateToken(sessionId, user);
            return { token, cookie, user };
        } catch {
            throw new Error('Cookie has wrong format.');
        }
    }

    public isValid(token: string): Token | undefined {
        return TokenService.verifyToken(token);
    }

    private generateToken(sessionId: string, user: User): string {
        const token = jwt.sign(
            { username: user.username, expiresIn: '10m', sessionId, userId: user.userId },
            Keys.privateKey(),
            {
                expiresIn: '10m'
            }
        );
        return token;
    }

    private generateCookie(sessionId: string): string {
        const cookie = jwt.sign({ sessionId }, Keys.privateCookieKey(), { expiresIn: '1d' });
        return cookie;
    }
}
