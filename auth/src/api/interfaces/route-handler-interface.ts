import express from 'express';

import { InjectableClass } from '../../core/modules/decorators';

export class RouteHandlerInterface extends InjectableClass {
    public index: (request: express.Request, response: express.Response) => void;
    public login: (request: express.Request, response: express.Response) => Promise<void>;
    public whoAmI: (request: express.Request, response: express.Response) => Promise<void>;
    public logout: (request: express.Request, response: express.Response) => void;
    public notFound: (request: express.Request, response: express.Response) => Promise<void>;
}
