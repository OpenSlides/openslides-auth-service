import jwt from 'jsonwebtoken';

import { Inject, InjectService } from '../../util/di';
import { KeyHandler } from '../interfaces/key-handler';
import { KeyService } from './key-service';
import { SessionHandler } from '../interfaces/session-handler';
import { SessionService } from './session-service';
import { Cookie, Ticket, Token } from '../../core/ticket';
import { TicketHandler } from '../interfaces/ticket-handler';
import { User } from '../../core/models/user';
import { UserHandler } from '../interfaces/user-handler';
import { UserService } from './user-service';
import { Validation } from '../interfaces/validation';

export class TicketService implements TicketHandler {
    public name = 'TokenHandler';

    @Inject(KeyService)
    private readonly keyHandler: KeyHandler;

    @InjectService(SessionService)
    private readonly sessionHandler: SessionHandler;

    @InjectService(UserService)
    private readonly userHandler: UserHandler;

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
        }
        const session = this.sessionHandler.addSession(user);
        const cookie = this.generateCookie(session);
        const token = this.generateToken(session, user);
        return { isValid: true, message: 'successful', result: { cookie, token, user } };
    }

    public async refresh(cookieAsString?: string): Promise<Validation<Ticket>> {
        if (!cookieAsString) {
            return { isValid: false, message: 'No token provided!' };
        }
        if (!cookieAsString.toLowerCase().startsWith('bearer')) {
            return { isValid: false, message: 'Wrong token' };
        }
        const result = this.verifyCookie(cookieAsString.slice(7));
        if (!result.result) {
            return { isValid: false, message: 'No cookie provided!' };
        }
        const cookie = result.result;
        if (!this.sessionHandler.hasSession(cookie.sessionId)) {
            return { isValid: false, message: 'You are not signed in!' };
        }
        const userId = this.sessionHandler.getUserIdBySessionId(cookie.sessionId);
        if (!userId) {
            return { isValid: false, message: 'Wrong user!' };
        }
        const userResult = await this.userHandler.getUserByUserId(userId);
        if (!userResult.result) {
            return { isValid: false, message: 'Wrong user!' };
        }
        const token = this.generateToken(cookie.sessionId, userResult.result);
        return {
            isValid: true,
            message: 'Successful',
            result: { cookie: cookieAsString, token, user: userResult.result }
        };
    }

    public validateToken(tokenString?: string): Validation<Token> {
        if (!tokenString) {
            return { isValid: false, message: 'No token provided!' };
        }
        if (!tokenString.toLowerCase().startsWith('bearer')) {
            return { isValid: false, message: 'Wrong token' };
        }
        const tokenResult = this.verifyToken(tokenString.slice(7));
        const token = tokenResult.result;
        if (!token) {
            return tokenResult;
        }
        if (!this.sessionHandler.hasSession(token.sessionId)) {
            return { isValid: false, message: 'You are not signed in!' };
        }
        return { isValid: true, message: 'Successful', result: token };
    }

    private generateToken(sessionId: string, user: User): string {
        const token = jwt.sign(
            { username: user.username, expiresIn: '10m', sessionId, userId: user.id },
            this.keyHandler.getPrivateTokenKey(),
            {
                expiresIn: '10m'
            }
        );
        return `bearer ${token}`;
    }

    private generateCookie(sessionId: string): string {
        const cookie = jwt.sign({ sessionId }, this.keyHandler.getPrivateCookieKey(), { expiresIn: '1d' });
        return `bearer ${cookie}`;
    }

    private validateJWT(token?: string): Validation<void> {
        if (!token) {
            return { isValid: false, message: 'No token provided!' };
        }
        if (!token.toLowerCase().startsWith('bearer')) {
            return { isValid: false, message: 'Wrong token' };
        }
        return { isValid: true, message: 'Successful' };
    }
}
