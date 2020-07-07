import express from 'express';

import { Constructable, InjectService } from '../../util/di';
import SessionService from '../../api/services/session-service';
import { Validator } from '../../api/interfaces/validator';

Constructable(Validator);
export class SessionValidator implements Validator {
    public name = 'SessionValidator';

    @InjectService(SessionService)
    private sessionHandler: SessionService;

    private cookie = 'cookie';

    public validate(request: any, response: express.Response, next: express.NextFunction): express.Response | void {
        const refreshId = request.cookies['refreshId'] as string;
        const cookie = this.sessionHandler.isValid(refreshId);
        if (!cookie) {
            return response.json({
                success: false,
                message: 'You are not signed in!'
            });
        }
        request[this.cookie] = cookie;
        next();
    }
}
