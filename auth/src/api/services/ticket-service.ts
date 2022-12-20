import { Factory } from 'final-di';
import jwt from 'jsonwebtoken';
import { Id } from 'src/core/key-transforms';

import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { ValidationException } from '../../core/exceptions/validation-exception';
import { Cookie, Ticket, Token } from '../../core/ticket';
import { JwtPayload } from '../../core/ticket/base-jwt';
import { SecretHandler } from '../interfaces/secret-handler';
import { TicketHandler } from '../interfaces/ticket-handler';
import { SecretService } from './secret-service';

export class TicketService extends TicketHandler {
    @Factory(SecretService)
    private readonly _secretHandler: SecretHandler;

    private get cookieSecret(): string {
        return this._secretHandler.getCookieSecret();
    }

    private get tokenSecret(): string {
        return this._secretHandler.getTokenSecret();
    }

    public decode<T>(toDecode: string): T {
        const parts = toDecode.split('.');
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        try {
            return JSON.parse(payload) as T;
        } catch (e) {
            throw new ValidationException('Malformed JSON. Unable to decode.');
        }
    }

    public createJwt(payload: JwtPayload, type: 'cookie' | 'token' = 'token'): Token | Cookie {
        if (type === 'token') {
            return this.generateToken(payload);
        } else {
            return this.generateCookie(payload);
        }
    }

    public create(userId: Id, session: string): Ticket {
        const cookie = this.generateCookie(session, userId);
        const token = this.generateToken(session, userId);
        return { cookie, token };
    }

    public refresh(cookie: Cookie): Ticket {
        const token = this.generateToken(cookie.sessionId, cookie.userId);
        return { cookie, token };
    }

    public verifyJwt(jwtEncoded: string, type: 'cookie' | 'token' = 'token'): Token | Cookie {
        if (!this.isBearer(jwtEncoded)) {
            throw new AuthenticationException(`Wrong ${type}`);
        }
        jwtEncoded = jwtEncoded.slice(7);
        if (type === 'token') {
            return this.verifyToken(jwtEncoded);
        } else {
            return this.verifyCookie(jwtEncoded);
        }
    }

    public verifyTicket(tokenEncoded: string, cookieEncoded: string): Ticket {
        this.checkBearerTicket(tokenEncoded, cookieEncoded);
        const token = this.verifyJwt(tokenEncoded) as Token;
        const cookie = this.verifyJwt(cookieEncoded, 'cookie') as Cookie;
        return { token, cookie };
    }

    private checkBearerTicket(tokenString: string, cookieString: string): void {
        if (!this.isBearer(tokenString)) {
            throw new ValidationException('AccessToken has wrong format');
        }
        if (!this.isBearer(cookieString)) {
            throw new ValidationException('RefreshId has wrong format!');
        }
    }

    private isBearer(jwtEncoded: string): boolean {
        const bearerBegin = 'bearer ';
        return jwtEncoded.toLowerCase().startsWith(bearerBegin);
    }

    private verifyToken(encodedToken: string): Token {
        return jwt.verify(encodedToken, this.tokenSecret) as Token;
    }

    private verifyCookie(encodedCookie: string): Cookie {
        return jwt.verify(encodedCookie, this.cookieSecret) as Cookie;
    }

    private generateToken(payload: JwtPayload): Token;
    private generateToken(sessionId: string, userId: Id): Token;
    private generateToken(sessionId: string | JwtPayload, userId?: Id): Token {
        const payload: JwtPayload =
            typeof sessionId === 'string' && userId ? { sessionId, userId } : (sessionId as JwtPayload);
        return new Token(payload, this.tokenSecret, { expiresIn: '10m' });
    }

    private generateCookie(payload: JwtPayload): Cookie;
    private generateCookie(sessionId: string, userId: Id): Cookie;
    private generateCookie(sessionId: string | JwtPayload, userId?: Id): Cookie {
        const payload: JwtPayload =
            typeof sessionId === 'string' && userId ? { sessionId, userId } : (sessionId as JwtPayload);
        return new Cookie(payload, this.cookieSecret, { expiresIn: '30d' });
    }
}
