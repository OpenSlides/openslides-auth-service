import express from 'express';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { Inject } from '../../util/di';
import { TicketHandler } from '../../api/interfaces/ticket-handler';
import { TicketService } from '../../api/services/ticket-service';
import { Validator } from '../../api/interfaces/validator';

export default class TicketValidator implements Validator {
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
        if (answer.isValid) {
            response.locals['token'] = answer.result;
            if (answer.header && answer.header.token) {
                response.locals['newToken'] = answer.header.token;
            }
            next();
        } else {
            return response.status(403).json(answer);
        }
    }
}
