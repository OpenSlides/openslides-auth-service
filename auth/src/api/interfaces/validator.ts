import express from 'express';

import { InjectableClass } from '../../util/di';

export class Validator extends InjectableClass {
    public validate: (
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
    ) => express.Response | void;
}
