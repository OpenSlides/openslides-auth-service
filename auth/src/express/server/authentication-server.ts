import cookieParser from 'cookie-parser';
import express, { Application, NextFunction, Request, Response } from 'express';
import { createServer, Server } from 'http';
import responseTime from 'response-time';

import { BaseServer } from '../../api/interfaces/base-server';
import { Inject } from '../../util/di';
import { ErrorHandler } from '../interfaces/error-handler';
import { LogErrorService } from '../middleware/log-error-service';
import { Logger } from '../../api/services/logger';
import Routes from '../routes/routes';

export default class AuthenticationServer extends BaseServer {
    public name = 'AuthenticationServer';

    @Inject(LogErrorService)
    private errorHandler: ErrorHandler;

    private app: Application;
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

    public getApp(): Application {
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
        this.app.use((req, res, next) => this.logRequestInformation(req, res, next));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use((req, res, next) => this.corsFunction(req, res, next));
        this.app.use(responseTime());
    }

    private initializeRoutes(): void {
        this.routes = new Routes(this.app);
        this.routes.initRoutes();
    }

    private initializeErrorHandlers(): void {
        this.app.use((error: any, req: Request, res: Response, next: NextFunction) =>
            this.errorHandler.handleError(error, req, res, next)
        );
    }

    private logRequestInformation(req: Request, res: Response, next: NextFunction): void {
        Logger.log(`${req.protocol}://${req.headers.host}: ${req.method} -- ${req.originalUrl}`);
        Logger.debug('Expected content-size:', req.headers['content-length']);
        Logger.debug('Incoming request with the following headers:\n', req.headers);
        next();
    }

    private corsFunction(req: Request, res: Response, next: NextFunction): void {
        Logger.debug('Set CORS-function');
        const origin = req.headers.origin;
        const requestingOrigin = Array.isArray(origin) ? origin.join(' ') : origin || '';
        res.setHeader('Content-Type', 'application/json');
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
