import jwt from 'jsonwebtoken';

import { Random } from '../../util/helper';
import { Validation } from '../interfaces/jwt-validator';
import { Cookie, Ticket, Token } from '../../core/ticket';
import { TokenHandler } from '../interfaces/token-handler';
import { User } from '../../core/models/user';
import { Inject } from '../../util/di';
import { KeyService } from './key-service';
import { KeyHandler } from '../interfaces/key-handler';

export class TokenService implements TokenHandler {
    public name = 'TokenHandler';

    @Inject(KeyService)
    private readonly keyHandler: KeyHandler;

    public verifyCookie(cookieAsString: string): Validation<Cookie> {
        try {
            return {
                isValid: true,
                message: 'Successful',
                result: jwt.verify(cookieAsString, this.keyHandler.getPrivateCookieKey()) as Cookie
            };
        } catch {
            return { isValid: false, message: 'Wrong cookie' };
        }
    }

    public verifyToken(tokenAsString: string): Validation<Token> {
        try {
            return {
                isValid: true,
                message: 'successful',
                result: jwt.verify(tokenAsString, this.keyHandler.getPrivateTokenKey()) as Token
            };
        } catch {
            return { isValid: false, message: 'Wrong token' };
        }
    }

    public decode<T>(tokenString: string): T {
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
        return this.verifyToken(token);
    }

    private generateToken(sessionId: string, user: User): string {
        const token = jwt.sign(
            { username: user.username, expiresIn: '10m', sessionId, userId: user.id },
            this.keyHandler.getPrivateTokenKey(),
            {
                expiresIn: '10m'
            }
        );
        return token;
    }

    private generateCookie(sessionId: string): string {
        const cookie = jwt.sign({ sessionId }, this.keyHandler.getPrivateCookieKey(), { expiresIn: '1d' });
        return cookie;
    }
}
