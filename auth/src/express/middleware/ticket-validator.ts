import express from 'express';

import { Inject } from '../../util/di';
import { TicketHandler } from '../../api/interfaces/ticket-handler';
import { TicketService } from '../../api/services/ticket-service';
import { Validator } from '../../api/interfaces/validator';

export default class TicketValidator implements Validator {
    private readonly token = 'token';

    @Inject(TicketService)
    private readonly ticketHandler: TicketHandler;

    public validate(request: any, response: express.Response, next: express.NextFunction): express.Response | void {
        const tokenEncoded = (request.headers['authentication'] || request.headers['authorization']) as string;
        const answer = this.ticketHandler.validateToken(tokenEncoded);
        if (answer.isValid) {
            request[this.token] = answer.result;
            next();
        } else {
            return response.json(answer);
        }
    }
}
