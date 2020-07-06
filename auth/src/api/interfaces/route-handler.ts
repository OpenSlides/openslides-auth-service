import express from 'express';

import { InjectableClass } from '../../util/di';

export abstract class RouteHandler extends InjectableClass {
    public abstract index: (request: express.Request, response: express.Response) => void;
    public abstract notFound: (request: express.Request, response: express.Response) => Promise<void>;

    public abstract login: (request: express.Request, response: express.Response) => Promise<void>;
    public abstract whoAmI: (request: express.Request, response: express.Response) => Promise<void>;
    public abstract logout: (request: express.Request, response: express.Response) => void;
    public abstract getListOfSessions: (request: express.Request, response: express.Response) => void;
    public abstract clearSessionById: (request: express.Request, response: express.Response) => void;
    public abstract clearAllSessionsExceptThemselves: (request: express.Request, response: express.Response) => void;
    public abstract hash: (request: express.Request, response: express.Response) => void;
}
