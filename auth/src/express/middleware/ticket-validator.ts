import { NextFunction, Request, Response } from 'express';
import { Factory } from 'final-di';
import { TokenExpiredError } from 'jsonwebtoken';
import { RestMiddleware } from 'rest-app/dist/esm/interfaces/rest-middleware';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { TicketHandler } from '../../api/interfaces/ticket-handler';
import { Logger } from '../../api/services/logger';
import { TicketService } from '../../api/services/ticket-service';
import { AnonymousException } from '../../core/exceptions/anonymous-exception';
import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { anonymous } from '../../core/models/anonymous';
import { Token } from '../../core/ticket';
import { createResponse } from '../../util/helper/functions';
import { ExpressError } from '../interfaces/error-handler';

const TOKEN_KEY = 'token';

interface Cookie {
    [key: string]: string;
}

export class TicketMiddleware implements RestMiddleware {
    @Factory(TicketService)
    private _ticketHandler: TicketHandler;

    public async use(request: Request, response: Response, next: NextFunction): Promise<void> {
        Logger.debug(`TicketValidator.validate: Incoming request to validate from: ${request.headers.origin || ''}`);

        if (!request.headers || !request.cookies) {
            throw new AuthenticationException('Undefined headers or cookies');
        }

        const tokenEncoded = (request.headers['authentication'] || request.headers['authorization']) as string;
        const cookieEncoded = (request.cookies as Cookie)[AuthHandler.COOKIE_NAME];
        Logger.debug(`tokenEncoded: ${tokenEncoded}`);
        Logger.debug(`cookieEncoded: ${cookieEncoded}`);
        try {
            const token = (await this._ticketHandler.validateTicket(tokenEncoded, cookieEncoded)).token;
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
            const newTicket = this._ticketHandler.refresh(cookieEncoded);
            const oldToken = this._ticketHandler.decode<Token>(tokenEncoded);
            this.next(response, next, { token: oldToken, newToken: (await newTicket).token.toString() });
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
}
