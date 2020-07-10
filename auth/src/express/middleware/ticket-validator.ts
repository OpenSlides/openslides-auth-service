import express from 'express';
import jwt from 'jsonwebtoken';

import { Constructable, Inject, InjectService } from '../../util/di';
import { KeyHandler } from '../../api/interfaces/key-handler';
import { KeyService } from '../../api/services/key-service';
import { Logger } from '../../api/services/logger';
import { SessionHandler } from '../../api/interfaces/session-handler';
import SessionService from '../../api/services/session-service';
import { TicketHandler } from '../../api/interfaces/ticket-handler';
import { TicketService } from '../../api/services/ticket-service';
import { Validator } from '../../api/interfaces/validator';

@Constructable(Validator)
export default class TicketValidator implements Validator {
    public name = 'TokenValidator';

    private readonly token = 'token';

    @Inject(KeyService)
    private readonly keyHandler: KeyHandler;

    @Inject(TicketService)
    private readonly ticketHandler: TicketHandler;

    @InjectService(SessionService)
    private readonly sessionHandler: SessionHandler;

    public validate(request: any, response: express.Response, next: express.NextFunction): express.Response | void {
        const tokenEncoded = (request.headers['authentication'] || request.headers['authorization']) as string;
        const answer = this.ticketHandler.isValid(tokenEncoded);
        if (answer.isValid) {
            request[this.token] = answer.result;
            next();
        } else {
            return response.json(answer);
        }
    }
}
