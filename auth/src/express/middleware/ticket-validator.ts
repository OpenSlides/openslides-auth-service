import express from 'express';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { Inject } from '../../util/di';
import { Logger } from '../../api/services/logger';
import { Token } from '../../core/ticket';
import { TicketHandler } from '../../api/interfaces/ticket-handler';
import { TicketService } from '../../api/services/ticket-service';
import { Validation } from '../../api/interfaces/validation';
import { Validator } from '../interfaces/validator';

export default class TicketValidator extends Validator {
    @Inject(TicketService)
    private readonly ticketHandler: TicketHandler;

    public async validate(
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
    ): Promise<express.Response | void> {
        const tokenEncoded = (request.headers['authentication'] || request.headers['authorization']) as string;
        const cookieEncoded = request.cookies[AuthHandler.COOKIE_NAME];
        const answer = await this.ticketHandler.validateTicket(tokenEncoded, cookieEncoded);
        Logger.debug(`tokenEncoded: ${tokenEncoded}`);
        Logger.debug(`cookieEncoded: ${cookieEncoded}`);
        Logger.debug(`answer: ${JSON.stringify(answer)}`);
        if (this.isAnonymous(answer)) {
            return this.sendResponse(answer.isValid, answer.reason, response, 200, answer.result);
        }
        if (answer.isValid) {
            response.locals['token'] = answer.result;
            if (answer.header && answer.header.token) {
                response.locals['newToken'] = answer.header.token;
            }
            next();
        } else {
            return this.sendResponse(false, answer.message, response, 403);
        }
    }

    private isAnonymous(token: Validation<Token>): boolean {
        return !!token.result && token.result.userId === 0;
    }
}
