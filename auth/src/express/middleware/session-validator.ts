import express from 'express';

import { Constructable, InjectService } from '../../util/di';
import { Logger } from '../../api/services/logger';
import SessionService from '../../api/services/session-service';
import { Validator } from '../../api/interfaces/validator';
import { SessionChecker } from '../../api/interfaces/session-checker';

Constructable(Validator);
export class SessionValidator implements SessionChecker {
    public name = 'SessionValidator';

    @InjectService(SessionService)
    private sessionHandler: SessionService;

    private cookie = 'cookie';

    public checkSession(request: any, response: express.Response, next: express.NextFunction): express.Response | void {
        // const refreshId = request.cookies['refreshId'] as string;
        // console.log('refresh id', refreshId);
        // let cookie = null;
        // const result = this.sessionHandler.isValid(refreshId);
        // try {
        //     cookie = this.sessionHandler.isValid(refreshId);
        // } catch (e) {
        //     Logger.log(`${e}`);
        //     return response.json({
        //         success: false,
        //         message: e
        //     });
        // }

        /**
         * has session
         */
        // if (!this.sessionHandler.hasSession()) {
        //     return response.json({
        //         success: false,
        //         message: result.message
        //     });
        // }

        // request[this.cookie] = result.result;
        next();
    }
}
