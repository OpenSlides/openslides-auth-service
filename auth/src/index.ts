import * as http from 'http';
import 'reflect-metadata';

import AuthenticationServer from './api/server/authentication-server';
import BaseServer from './api/interfaces/base-server';
import { Inject } from './core/modules/decorators';

class Server {
    private readonly PORT: number = parseInt(process.env.PORT || '', 10) || 8000;

    public get port(): number {
        return this.PORT;
    }

    @Inject(BaseServer)
    private httpServer: AuthenticationServer;

    public start(): void {
        this.httpServer.getServer().listen(this.PORT, () => {
            console.log(`Server is running on port ${this.PORT}`);
        });
    }
}

const server = new Server();
server.start();
// const PORT: number = parseInt(process.env.PORT || '', 10) || 8000;

// const authServer: BaseServer = AuthenticationServer.getInstance();
// const server: http.Server = authServer.getServer();
// server.listen(PORT);
console.log(`Server is running on port ${server.port}`);
