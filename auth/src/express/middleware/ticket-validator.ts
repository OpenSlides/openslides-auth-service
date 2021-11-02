import { NextFunction, Request, Response } from 'express';
import { Factory, Inject } from 'final-di';
import { TokenExpiredError } from 'jsonwebtoken';
import { RestMiddleware } from 'rest-app/dist/esm/interfaces/rest-middleware';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { SessionHandler } from '../../api/interfaces/session-handler';
import { TicketHandler } from '../../api/interfaces/ticket-handler';
import { AuthService } from '../../api/services/auth-service';
import { Logger } from '../../api/services/logger';
import { SessionService } from '../../api/services/session-service';
import { TicketService } from '../../api/services/ticket-service';
import { AnonymousException } from '../../core/exceptions/anonymous-exception';
import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { ValidationException } from '../../core/exceptions/validation-exception';
import { anonymous } from '../../core/models/anonymous';
import { Cookie, Ticket, Token } from '../../core/ticket';
import { createResponse } from '../../util/helper/functions';
import { ExpressError } from '../interfaces/error-handler';

const TOKEN_KEY = 'token';

interface CookieHeader {
    [key: string]: string;
}

export class TicketMiddleware implements RestMiddleware {
    @Factory(TicketService)
    private _ticketHandler: TicketHandler;

    @Factory(AuthService)
    private _authHandler: AuthHandler;

    @Inject(SessionService)
    private _sessionHandler: SessionHandler;

    public async use(request: Request, response: Response, next: NextFunction): Promise<void> {
        Logger.debug(`TicketValidator.validate: Incoming request to validate from: ${request.headers.origin || ''}`);

        if (!request.headers || !request.cookies) {
            throw new AuthenticationException('Undefined headers or cookies');
        }

        const tokenEncoded = (request.headers[AuthHandler.AUTHENTICATION_HEADER] ||
            request.headers[AuthHandler.AUTHORIZATION_HEADER]) as string;
        const cookieEncoded = (request.cookies as CookieHeader)[AuthHandler.COOKIE_NAME];
        Logger.debug(`tokenEncoded: ${tokenEncoded}`);
        Logger.debug(`cookieEncoded: ${cookieEncoded}`);
        try {
            const token = (await this.validateTicket(tokenEncoded, cookieEncoded)).token;
            Logger.debug(`token: ${JSON.stringify(token)}`);
            this.next(response, next, { token });
        } catch (e) {
            if (e instanceof TokenExpiredError) {
                await this.refreshToken({ cookieEncoded, tokenEncoded }, response, next);
            } else if (e instanceof AnonymousException) {
                response.json(createResponse(anonymous, 'anonymous'));
            } else {
                const { status, message }: ExpressError = e as ExpressError;
                const statusCode = status ?? 403;
                response.status(statusCode).json(createResponse({}, message, false));
            }
        }
    }

    private next(res: Response, next: NextFunction, { token, newToken }: { token: Token; newToken?: string }): void {
        if (newToken) {
            this.setNewToken(res, newToken);
        }
        res.locals[TOKEN_KEY] = token;
        next();
    }

    private setNewToken(res: Response, newToken: string): void {
        res.setHeader(AuthHandler.AUTHENTICATION_HEADER, newToken);
        res.setHeader('Access-Control-Expose-Header', 'Authentication');
    }

    private async refreshToken(
        { cookieEncoded, tokenEncoded }: { cookieEncoded: string; tokenEncoded: string },
        response: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const newTicket = await this._authHandler.whoAmI(cookieEncoded);
            const oldToken = this._ticketHandler.decode<Token>(tokenEncoded);
            this.next(response, next, { token: oldToken, newToken: newTicket.token.toString() });
        } catch (e) {
            Logger.debug('Error while refreshing an access-token');
            Logger.debug(e);
            if (e instanceof TokenExpiredError) {
                Logger.debug('Cookie jwt is expired. Treat it like an anonymous.');
                response.json(createResponse(anonymous, 'anonymous'));
            } else {
                const { status, message }: ExpressError = e as ExpressError;
                const statusCode = status ?? 403;
                response.status(statusCode).json(createResponse({}, message, false));
            }
        }
    }

    private async validateTicket(tokenEncoded?: string, cookieEncoded?: string): Promise<Ticket> {
        if (!tokenEncoded || !cookieEncoded) {
            throw new AnonymousException();
        }
        const { token, cookie }: Ticket = this._ticketHandler.verifyTicket(tokenEncoded, cookieEncoded);
        await this.checkSessionOfTicket(token, cookie);
        return { token, cookie };
    }

    private async checkSessionOfTicket(token: Token, cookie: Cookie): Promise<void> {
        if (token.sessionId !== cookie.sessionId) {
            throw new ValidationException('Mismatched session');
        }
        if (!(await this._sessionHandler.hasSession(cookie.sessionId))) {
            throw new ValidationException('Not signed in');
        }
    }
}
