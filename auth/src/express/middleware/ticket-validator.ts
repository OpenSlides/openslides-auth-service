import express from 'express';
import jwt from 'jsonwebtoken';

import { Constructable, Inject, InjectService } from '../../util/di';
import { Validator } from '../../api/interfaces/validator';
import { KeyService } from '../../api/services/key-service';
import { KeyHandler } from '../../api/interfaces/key-handler';
import { Logger } from '../../api/services/logger';
import { TicketHandler } from '../../api/interfaces/ticket-handler';
import { TicketService } from '../../api/services/ticket-service';
import SessionService from '../../api/services/session-service';
import { SessionHandler } from '../../api/interfaces/session-handler';

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
        let tokenEncoded = (request.headers['authentication'] || request.headers['authorization']) as string;
        if (!tokenEncoded) {
            return response.json({
                success: false,
                message: 'Auth token is not supplied'
            });
        }
        const tokenParts = tokenEncoded.split(' ');
        if (!tokenParts[0].toLowerCase().startsWith('bearer')) {
            Logger.log('no bearer');
            return response.status(400).json({
                success: false,
                message: 'Wrong token'
            });
        }
        tokenEncoded = tokenParts[1];

        try {
            const token = jwt.verify(tokenEncoded, this.keyHandler.getPrivateTokenKey());
            console.log('token', token);
            request[this.token] = token;
            next();
        } catch (e) {
            return response.json({
                success: false,
                message: `Token is not valid: ${e.message}`
            });
        }
    }
}
