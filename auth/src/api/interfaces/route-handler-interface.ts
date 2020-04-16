import express from 'express';

import { InjectableClass } from '../../core/modules/decorators';

export class RouteHandlerInterface extends InjectableClass {
    index: (request: express.Request, response: express.Response) => void;
    login: (request: express.Request, response: express.Response) => Promise<void>;
    whoAmI: (request: express.Request, response: express.Response) => Promise<void>;
    logout: (request: express.Request, response: express.Response) => void;
    notFound: (request: express.Request, response: express.Response) => Promise<void>;
}
