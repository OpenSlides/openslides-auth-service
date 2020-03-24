import * as http from 'http';

export default interface BaseServer {
    getServer: () => http.Server;
    getApp: () => Express.Application;
}
