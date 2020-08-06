import cookieParser from 'cookie-parser';
import express from 'express';
import { createServer, Server } from 'http';

import { BaseServer } from '../../api/interfaces/base-server';
import { Logger } from '../../api/services/logger';
import Routes from '../routes/routes';

export default class AuthenticationServer implements BaseServer {
    public name = 'AuthenticationServer';

    private app: express.Application;
    private server: Server;
    private routes: Routes;

    public constructor() {
        this.createApp();
        this.createServer();
        this.initializeConfig();
        this.initializeRoutes();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private initializeConfig(): void {
        this.app.use((req, res, next) => this.corsFunction(req, res, next));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());
        this.app.use(cookieParser());
    }

    private initializeRoutes(): void {
        this.routes = new Routes(this.app);
        this.routes.initRoutes();
    }

    public getApp(): express.Application {
        return this.app;
    }

    public getServer(): Server {
        return this.server;
    }

    private corsFunction(req: express.Request, res: express.Response, next: express.NextFunction): void {
        const origin = req.headers.origin;
        const requestingOrigin = Array.isArray(origin) ? origin.join(' ') : origin || '';
        Logger.log(`${req.method} -- ${req.path}`);
        res.setHeader('Access-Control-Allow-Origin', requestingOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, DELETE, PUT');
        res.setHeader(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, X-Content-Type, Authentication, Authorization, X-Access-Token, Accept'
        );
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        return next();
    }
}
