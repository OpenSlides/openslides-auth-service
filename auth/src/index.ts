import * as http from 'http';

import AuthenticationServer from './api/server/authentication-server';
import BaseServer from './api/interfaces/base-server';

// let reqCnt: number = 1;
const PORT: number = parseInt(process.env.PORT || '', 10) || 8000;

// http.createServer((req, res) => {
//     const message = `Request Count: ${reqCnt}`;

//     res.writeHead(200, { 'Content-Type': 'text/html' });
//     res.end(`<html><head><meta http-equiv="refresh" content="2"></head><body>${message}</body></html>`);

//     console.log('handled request: ' + reqCnt++);
// }).listen(PORT);

const authServer: BaseServer = AuthenticationServer.getInstance();
const server: http.Server = authServer.getServer();
// const server: http.Server = AuthenticationServer.getInstance().getServer();
server.listen(PORT);
console.log(`Server is running on port ${PORT}`);
