import express from 'express';

import { Middleware } from '../base/middleware';

export abstract class Validator extends Middleware {
    public abstract validate(
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
    ): Promise<express.Response | void>;
}
