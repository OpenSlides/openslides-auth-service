import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { anonymous } from '../../core/models/anonymous';
import { BaseException } from '../../core/exceptions/base-exception';
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
import { ValidationException } from '../../core/exceptions/validation-exception';

export class TicketService extends TicketHandler {
    public name = 'TokenHandler';

    @Inject(KeyService)
    private readonly keyHandler: KeyHandler;

    @InjectService(SessionService)
    private readonly sessionHandler: SessionHandler;

    @InjectService(UserService)
    private readonly userHandler: UserHandler;

    private readonly anonymousMessage = {
        isValid: true,
        message: 'Successful',
        reason: 'anonymous'
    };

    public verifyCookie(cookieAsString: string): Validation<Cookie> {
        try {
            return {
                isValid: true,
                message: 'Successful',
                result: jwt.verify(cookieAsString, this.keyHandler.getPrivateCookieKey()) as Cookie
            };
        } catch (e) {
            return { isValid: false, message: 'Wrong cookie', reason: e };
        }
    }

    public verifyToken(tokenAsString: string): Validation<Token> {
        try {
            return {
                isValid: true,
                message: 'successful',
                result: jwt.verify(tokenAsString, this.keyHandler.getPrivateTokenKey()) as Token
            };
        } catch (e) {
            return { isValid: false, message: 'Wrong token', reason: e };
        }
    }

    public decode<T>(tokenString: string): T {
        const parts = tokenString.split('.');
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        try {
            return JSON.parse(payload) as T;
        } catch (e) {
            throw new ValidationException('Malformed JSON. Unable to decode.');
        }
    }

    public async create(user: User): Promise<Validation<Ticket>> {
        if (!Object.keys(user).length) {
            return { isValid: false, message: 'User is empty.' };
        }
        const session = await this.sessionHandler.addSession(user);
        const cookie = this.generateCookie(session);
        const token = this.generateToken(session, user);
        return { isValid: true, message: 'successful', result: { cookie, token, user } };
    }

    public async refresh(cookieAsString?: string): Promise<Validation<Ticket>> {
        if (!cookieAsString) {
            return this.anonymousMessage; // login as guest
        }
        if (!cookieAsString.toLowerCase().startsWith('bearer ')) {
            return { isValid: false, message: 'Wrong token' };
        }
        const result = this.verifyCookie(cookieAsString.slice(7));
        if (!result.result) {
            return { ...result } as Validation<Ticket>;
        }
        const cookie = result.result;
        if (!this.sessionHandler.hasSession(cookie.sessionId)) {
            return { isValid: false, message: 'You are not signed in!' };
        }
        const userId = await this.sessionHandler.getUserIdBySessionId(cookie.sessionId);
        const userResult = await this.userHandler.getUserByUserId(userId);
        if (!userResult.result) {
            this.sessionHandler.clearSessionById(cookie.sessionId);
            return { isValid: false, message: 'Wrong user!' };
        }
        const token = this.generateToken(cookie.sessionId, userResult.result);
        return {
            isValid: true,
            message: 'Successful',
            result: { cookie: cookieAsString, token, user: userResult.result }
        };
    }

    public async validateTicket(tokenString?: string, cookieString?: string): Promise<Validation<Token>> {
        if (!tokenString || !cookieString) {
            return { ...this.anonymousMessage, result: anonymous };
        }
        try {
            this.checkBearerTicket(tokenString, cookieString);
            await this.checkSessionOfTicket(tokenString, cookieString);
            return this.checkAndRefreshToken(tokenString, cookieString);
        } catch (e) {
            if (e instanceof BaseException || e instanceof Error) {
                return { isValid: false, message: e.message };
            }
            return { isValid: false, message: 'Unknown error occurred.', reason: e };
        }
    }

    private checkBearerTicket(tokenString: string, cookieString: string): void {
        const tokenBegin = 'bearer ';
        if (!tokenString.toLowerCase().startsWith(tokenBegin) || !cookieString.toLowerCase().startsWith(tokenBegin)) {
            throw new ValidationException('Wrong ticket!');
        }
    }

    private async checkSessionOfTicket(tokenString: string, cookieString: string): Promise<void> {
        const cookie = this.decode<Cookie>(cookieString);
        const token = this.decode<Token>(tokenString);
        if (cookie.sessionId !== token.sessionId) {
            throw new ValidationException('Mismatched sessions!');
        }
        if (!(await this.sessionHandler.hasSession(cookie.sessionId))) {
            throw new ValidationException('Not signed in!');
        }
    }

    private async checkAndRefreshToken(tokenString: string, cookieString: string): Promise<Validation<Token>> {
        const answer: Validation<Token> = { isValid: true, message: 'Successful' };
        const tokenResult = this.verifyToken(tokenString.slice(7));
        if (!tokenResult.isValid) {
            if (tokenResult.reason instanceof TokenExpiredError) {
                const newToken = (await this.refresh(cookieString)).result?.token as string;
                answer.result = this.decode(newToken);
                answer.header = { token: newToken };
            } else {
                return tokenResult;
            }
        } else {
            answer.result = tokenResult.result;
        }
        return answer;
    }

    private generateToken(sessionId: string, user: User): string {
        const token = jwt.sign({ expiresIn: '10m', sessionId, userId: user.id }, this.keyHandler.getPrivateTokenKey(), {
            expiresIn: '10m',
            algorithm: 'HS256'
        });
        return `bearer ${token}`;
    }

    private generateCookie(sessionId: string): string {
        const cookie = jwt.sign({ sessionId }, this.keyHandler.getPrivateCookieKey(), {
            expiresIn: '1d',
            algorithm: 'HS256'
        });
        return `bearer ${cookie}`;
    }
}
