import { Factory, Inject } from 'final-di';
import jwt from 'jsonwebtoken';

import { AnonymousException } from '../../core/exceptions/anonymous-exception';
import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { ValidationException } from '../../core/exceptions/validation-exception';
import { User } from '../../core/models/user';
import { Cookie, Ticket, Token } from '../../core/ticket';
import { KeyHandler } from '../interfaces/key-handler';
import { SessionHandler } from '../interfaces/session-handler';
import { TicketHandler } from '../interfaces/ticket-handler';
import { UserHandler } from '../interfaces/user-handler';
import { KeyService } from './key-service';
import { SessionService } from './session-service';
import { UserService } from './user-service';

export class TicketService extends TicketHandler {
    @Factory(KeyService)
    private readonly _keyHandler: KeyHandler;

    @Inject(SessionService)
    private readonly _sessionHandler: SessionHandler;

    @Inject(UserService)
    private readonly _userHandler: UserHandler;

    private get cookieKey(): string {
        return this._keyHandler.getCookieKey();
    }

    private get tokenKey(): string {
        return this._keyHandler.getTokenKey();
    }

    public verifyCookie(cookieAsString: string): Cookie {
        if (this.isBearer(cookieAsString)) {
            cookieAsString = cookieAsString.slice(7);
        }
        return jwt.verify(cookieAsString, this.cookieKey) as Cookie;
    }

    public verifyToken(tokenAsString: string): Token {
        if (this.isBearer(tokenAsString)) {
            tokenAsString = tokenAsString.slice(7);
        }
        return jwt.verify(tokenAsString, this.tokenKey) as Token;
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

    public async create(user: User): Promise<Ticket> {
        if (!Object.keys(user).length) {
            throw new AuthenticationException('Wrong user');
        }
        const session = await this._sessionHandler.addSession(user);
        const cookie = this.generateCookie(session, user);
        const token = this.generateToken(session, user);
        return { cookie, token };
    }

    public async refresh(cookieAsString?: string): Promise<Ticket> {
        if (!cookieAsString) {
            throw new AnonymousException();
        }
        if (!this.isBearer(cookieAsString)) {
            throw new AuthenticationException('Wrong token');
        }
        const cookie = this.verifyCookie(cookieAsString);
        if (!(await this._sessionHandler.hasSession(cookie.sessionId))) {
            throw new AuthenticationException('Not signed in');
        }
        const userId = await this._sessionHandler.getUserIdBySessionId(cookie.sessionId);
        const user = await this._userHandler.getUserByUserId(userId);
        if (!user) {
            await this._sessionHandler.clearSessionById(cookie.sessionId);
            throw new AuthenticationException('Wrong user');
        }
        const token = this.generateToken(cookie.sessionId, user);
        return { cookie, token };
    }

    public async validateTicket(tokenString?: string, cookieString?: string): Promise<Ticket> {
        if (!tokenString || !cookieString) {
            throw new AnonymousException();
        }
        this.checkBearerTicket(tokenString, cookieString);
        const token = this.verifyToken(tokenString);
        const cookie = this.verifyCookie(cookieString);
        await this.checkSessionOfTicket(token, cookie);
        return { token, cookie };
    }

    private checkBearerTicket(tokenString: string, cookieString: string): void {
        if (!this.isBearer(tokenString)) {
            throw new ValidationException('Access-Token has wrong format');
        }
        if (!this.isBearer(cookieString)) {
            throw new ValidationException('Cookie has wrong format!');
        }
    }

    private async checkSessionOfTicket(token: Token, cookie: Cookie): Promise<void> {
        if (cookie.sessionId !== token.sessionId) {
            throw new ValidationException('Mismatched sessions!');
        }
        if (!(await this._sessionHandler.hasSession(cookie.sessionId))) {
            throw new ValidationException('Not signed in!');
        }
    }

    private isBearer(jwtEncoded: string): boolean {
        const bearerBegin = 'bearer ';
        return jwtEncoded.toLowerCase().startsWith(bearerBegin);
    }

    private generateToken(sessionId: string, user: User): Token {
        return new Token({ sessionId, userId: user.id }, this.tokenKey, { expiresIn: '10m' });
    }

    private generateCookie(sessionId: string, user: User): Cookie {
        return new Cookie({ sessionId, userId: user.id }, this.cookieKey, { expiresIn: '1d' });
    }
}
