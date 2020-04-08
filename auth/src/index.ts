import * as http from 'http';
import 'reflect-metadata';

import AuthenticationServer from './api/server/authentication-server';
import BaseServer from './api/interfaces/base-server';

const PORT: number = parseInt(process.env.PORT || '', 10) || 8000;

const authServer: BaseServer = AuthenticationServer.getInstance();
const server: http.Server = authServer.getServer();
server.listen(PORT);
console.log(`Server is running on port ${PORT}`);
