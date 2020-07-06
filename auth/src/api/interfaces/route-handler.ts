import express from 'express';

import { InjectableClass } from '../../util/di';

export class RouteHandler extends InjectableClass {
    public index: (request: express.Request, response: express.Response) => void;
    public notFound: (request: express.Request, response: express.Response) => Promise<void>;

    public login: (request: express.Request, response: express.Response) => Promise<void>;
    public whoAmI: (request: express.Request, response: express.Response) => Promise<void>;
    public logout: (request: express.Request, response: express.Response) => void;
    public getListOfSessions: (request: express.Request, response: express.Response) => void;
    public clearSessionById: (request: express.Request, response: express.Response) => void;
    public clearAllSessionsExceptThemselves: (request: express.Request, response: express.Response) => void;
    public hash: (request: express.Request, response: express.Response) => void;
}