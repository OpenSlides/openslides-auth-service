import bodyParser from 'body-parser';
import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import { createServer, Server } from 'http';

import Routes from './routes/Routes';

export default class AuthenticationServer {
    private static instance: AuthenticationServer;

    private readonly PORT: number = 5000;

    private app: express.Application;
    private port: string | number;
    private server: Server;
    private routes: Routes;

    private constructor() {
        dotenv.config();
        this.createApp();
        this.createServer();
        this.initializeConfig();
        this.initializeRoutes();
        this.listen();
    }

    public static getInstance(): AuthenticationServer {
        if (!this.instance) {
            this.instance = new AuthenticationServer();
        }
        return this.instance;
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private initializeConfig(): void {
        dotenv.config();
        this.port = process.env.PORT || this.PORT;
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
    }

    private initializeRoutes(): void {
        this.routes = new Routes(this.app);
        this.routes.initRoutes();
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}`);
        });
    }

    public getApp(): express.Application {
        return this.app;
    }
}
