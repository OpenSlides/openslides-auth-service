import cookieParser from 'cookie-parser';
import express from 'express';
import { createServer, Server } from 'http';

import { BaseServer } from '../../api/interfaces/base-server';
import { Config } from '../../config';
import { Logger } from '../../api/services/logger';
import Routes from '../routes/routes';

export default class AuthenticationServer implements BaseServer {
    public static readonly ALLOWED_ORIGINS = [
        process.env.INSTANCE_DOMAIN,
        'http://localhost:4200',
        'http://localhost:4210',
        'http://localhost:9004',
        Config.DATASTORE_READER,
        Config.DATASTORE_WRITER
    ];

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
        if (AuthenticationServer.ALLOWED_ORIGINS.indexOf(requestingOrigin) > -1) {
            res.setHeader('Access-Control-Allow-Origin', requestingOrigin);
            Logger.log(`${requestingOrigin} -- is allowed:`);
        } else {
            Logger.log(`${requestingOrigin} -- blocked.`);
            res.json({ success: false, message: 'Domain has been blocked!' });
            return;
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, DELETE, PUT');
        res.setHeader(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, X-Content-Type, Authentication, Authorization, X-Access-Token, Accept'
        );
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        return next();
    }
}
