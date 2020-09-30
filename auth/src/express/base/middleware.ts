import { Response } from 'express';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { Logger } from '../../api/services/logger';

export interface HttpData {
    [key: string]: any;
}

export abstract class Middleware {
    protected sendResponse(
        success: boolean,
        message: string,
        response: Response,
        code: number = 200,
        data: HttpData = {}
    ): void {
        if (response.locals['newToken']) {
            response.setHeader('Authentication', response.locals['newToken']);
            response.setHeader('Access-Control-Expose-Headers', 'authentication, Authentication');
        }
        if (response.locals['newCookie']) {
            response.cookie(AuthHandler.COOKIE_NAME, response.locals['newCookie'], {
                secure: false,
                httpOnly: true
            });
        }
        Logger.debug(`Successful: ${success} --- Message: ${message}`);
        response.status(code).send({
            success,
            message,
            ...data
        });
    }
}
