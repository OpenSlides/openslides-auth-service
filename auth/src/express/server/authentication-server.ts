import cookieParser from 'cookie-parser';
import express from 'express';
import { createServer, Server } from 'http';
import responseTime from 'response-time';

import { BaseServer } from '../../api/interfaces/base-server';
import { Inject } from '../../util/di';
import { ErrorHandler } from '../interfaces/error-handler';
import { LogErrorHandler } from '../middleware/log-error-handler';
import { Logger } from '../../api/services/logger';
import Routes from '../routes/routes';

export default class AuthenticationServer extends BaseServer {
    public name = 'AuthenticationServer';

    @Inject(LogErrorHandler)
    private logErrorHandler: ErrorHandler;

    private app: express.Application;
    private server: Server;
    private routes: Routes;

    public constructor() {
        super();
        this.createApp();
        this.createServer();
        this.initializeConfig();
        this.initializeRoutes();
        this.initializeErrorHandlers();
    }

    public getApp(): express.Application {
        return this.app;
    }

    public getServer(): Server {
        return this.server;
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
        this.app.use(responseTime());
    }

    private initializeRoutes(): void {
        this.routes = new Routes(this.app);
        this.routes.initRoutes();
    }

    private initializeErrorHandlers(): void {
        this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) =>
            this.logErrorHandler.handleError(error, req, res, next)
        );
    }

    private corsFunction(req: express.Request, res: express.Response, next: express.NextFunction): void {
        const origin = req.headers.origin;
        const requestingOrigin = Array.isArray(origin) ? origin.join(' ') : origin || '';
        Logger.log(`${req.protocol}://${req.headers.host}: ${req.method} -- ${req.originalUrl}`);
        Logger.debug(`Params:`, req.params);
        Logger.debug(`Body:`, req.body);
        Logger.debug(`Header:`, req.headers);
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
