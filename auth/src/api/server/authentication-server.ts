import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { createServer, Server } from 'http';

import BaseServer from '../interfaces/base-server';
import { Constructable } from '../../core/modules/decorators';
import Routes from '../routes/Routes';

@Constructable(BaseServer)
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
        this.app.use(
            cors({
                allowedHeaders:
                    'Origin, X-Requested-With, Content-Type, X-Content-Type, Authentication, Authorization, X-Access-Token, Accept',
                credentials: true,
                origin: 'http://localhost:4200',
                methods: 'OPTIONS, GET, POST, PUT, DELETE'
            })
        );
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
}
