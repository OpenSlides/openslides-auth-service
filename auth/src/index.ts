import 'reflect-metadata';

import AuthenticationServer from './express/server/authentication-server';
import { BaseServer } from './api/interfaces/base-server';
import { Inject } from './util/di';
import { Logger } from './api/services/logger';

class Server {
    public static readonly PORT: number = parseInt(process.env.PORT || '', 10) || 9004;
    public static readonly DOMAIN: string = process.env.INSTANCE_DOMAIN || 'http://localhost';

    public get port(): number {
        return Server.PORT;
    }

    @Inject(BaseServer)
    private httpServer: AuthenticationServer;

    public start(): void {
        this.httpServer.getServer().listen(Server.PORT, () => {
            Logger.log(`Server is running on ${Server.DOMAIN}:${Server.PORT}`);
        });
    }
}

const server = new Server();
server.start();
