import { exception } from 'console';
import jwt from 'jsonwebtoken';

import { Keys } from '../../config';
import { Random } from '../../util/helper';
import { Cookie, Ticket, Token } from '../../core/ticket';
import { TokenHandler } from '../interfaces/token-handler';
import { User } from '../../core/models/user';
import { Validation } from '../interfaces/jwt-validator';

export class TokenService implements TokenHandler {
    public name = 'TokenHandler';

    public static verifyCookie(cookieAsString: string): Validation<Cookie> {
        try {
            return {
                isValid: true,
                message: 'Successful',
                result: jwt.verify(cookieAsString, Keys.privateCookieKey()) as Cookie
            };
        } catch {
            return { isValid: false, message: 'Wrong cookie' };
        }
    }

    public static verifyToken(tokenAsString: string): Validation<Token> {
        try {
            return {
                isValid: true,
                message: 'successful',
                result: jwt.verify(tokenAsString, Keys.privateKey()) as Token
            };
        } catch {
            return { isValid: false, message: 'Wrong token' };
        }
    }

    public static decode<T>(tokenString: string): T {
        const parts = tokenString.split('.');
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload) as T;
    }

    public async create(user: User): Promise<Validation<Ticket>> {
        if (!Object.keys(user).length) {
            return { isValid: false, message: 'User is empty.' };
            // throw new Error('user is empty.');
        }
        const sessionId = Random.cryptoKey(32);
        user.setSession(sessionId);
        const cookie = this.generateCookie(sessionId);
        const token = this.generateToken(sessionId, user);
        return { isValid: true, message: 'successful', result: { cookie, token, user } };
    }

    public async refresh(cookie: string, sessionId: string, user: User): Promise<Validation<Ticket>> {
        try {
            const token = this.generateToken(sessionId, user);
            return { isValid: true, message: 'Successful', result: { token, cookie, user } };
        } catch {
            return { isValid: false, message: 'Cookie has wrong format' };
            // throw new Error('Cookie has wrong format.');
        }
    }

    public isValid(token: string): Validation<Token> {
        return TokenService.verifyToken(token);
    }

    private generateToken(sessionId: string, user: User): string {
        const token = jwt.sign(
            { username: user.username, expiresIn: '10m', sessionId, userId: user.id },
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
