import { NextFunction, Request, Response } from 'express';

import { InjectableClass } from '../../core/modules/decorators';
import { User } from '../../core/models/user/user';

export default class SessionHandlerInterface extends InjectableClass {
    public validateSession: (request: Request, response: Response, next: NextFunction) => Response | void;
    public getAllActiveSessions: () => string[];
    public clearSessionById: (sessionId: string) => boolean;
    public clearAllSessionsExceptThemselves: (exceptSessionId: string) => boolean;
    public hasSession: (sessionId: string) => boolean;
    public addSession: (user: User) => boolean;
}
