import express from 'express';

import { InjectableClass } from '../../util/di';

export abstract class Validator extends InjectableClass {
    public abstract validate: (
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
    ) => express.Response | void;
}
