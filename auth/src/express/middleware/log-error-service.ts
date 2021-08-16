import { Request, Response } from 'express';

import { Logger } from '../../api/services/logger';
import { BaseException } from '../../core/exceptions/base-exception';
import { Middleware } from '../base/middleware';
import { ErrorHandler, ExpressError } from '../interfaces/error-handler';

export class LogErrorService extends Middleware implements ErrorHandler {
    public handleError(error: ExpressError, request: Request, response: Response): void {
        const errorPath = `${request.method} -- ${request.url}`;
        Logger.error('Error in middleware occurred!');
        Logger.error(errorPath);
        Logger.error('Params:', request.params);
        Logger.error('Body:', request.body);
        Logger.error('Header:', request.headers);
        Logger.error('Error:', error);
        const expectedSize = error.expected;
        const received = error.received;
        Logger.error(`Expected size of request data: ${expectedSize} - Received content length: ${received}`);
        if (error instanceof BaseException) {
            this.sendResponse(false, response, error.title, 500);
        } else {
            this.sendResponse(false, response, `Something went wrong: ${errorPath}`, 500);
        }
        return;
    }
}
