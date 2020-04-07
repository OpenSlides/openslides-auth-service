import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { createServer, Server } from 'http';

import BaseServer from '../interfaces/base-server';
import Routes from '../routes/Routes';

export default class AuthenticationServer implements BaseServer {
    private static instance: AuthenticationServer;

    public name = 'AuthenticationServer';

    private app: express.Application;
    private server: Server;
    private routes: Routes;

    private constructor() {
        this.createApp();
        this.createServer();
        this.initializeConfig();
        this.initializeRoutes();
    }

    /**
     * Returns the instance of the auth-server.
     * Creates an instance, if not already existing.
     *
     * @param port The port the server should listen to.
     *
     * @returns The instance of the auth-server.
     */
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
        this.app.use(cors());
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
