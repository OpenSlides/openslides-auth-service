import { Response } from 'express';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { HttpData } from '../../api/services/http-service';
import { Logger } from '../../api/services/logger';

export abstract class Middleware {
    protected sendResponse(
        success: boolean,
        response: Response,
        message: string = 'Action handled successfully',
        code: number = 200,
        data: HttpData = {}
    ): void {
        if (response.locals['newToken']) {
            Logger.debug('Set a new token: ', response.locals['newToken']);
            response.setHeader('Authentication', response.locals['newToken']);
            response.setHeader('Access-Control-Expose-Headers', 'authentication, Authentication');
        }
        if (response.locals['newCookie']) {
            Logger.debug('Set a new refresh-id: ', response.locals['newCookie']);
            response.cookie(AuthHandler.COOKIE_NAME, response.locals['newCookie'], {
                secure: false,
                httpOnly: true
            });
        }
        Logger.debug(`Successful: ${code} ${success.toString()} --- Message: ${message}`);
        Logger.debug('Send data:', data);
        response.status(code).send({
            success,
            message: message.toString(),
            ...data
        });
    }
}
