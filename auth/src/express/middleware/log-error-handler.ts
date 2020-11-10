import { NextFunction, Request, Response } from 'express';

import { Error, ErrorHandler } from '../interfaces/error-handler';
import { Logger } from '../../api/services/logger';
import { Middleware } from '../base/middleware';

export class LogErrorHandler extends Middleware implements ErrorHandler {
    public handleError(error: Error, request: Request, response: Response, _: NextFunction): void {
        const errorPath = `${request.method} -- ${request.url}`;
        Logger.error('Error in middleware occurred!');
        Logger.error(errorPath);
        Logger.error(`Params: ${JSON.stringify(request.params)}`);
        Logger.error(`Body: ${JSON.stringify(request.body)}`);
        Logger.error(`Header: ${JSON.stringify(request.headers)}`);
        Logger.error(`An error occurred: ${JSON.stringify(error)}`);
        Logger.error(error.stack);
        this.sendResponse(false, `Something went wrong while ${errorPath}`, response, 500);
        return;
    }
}
