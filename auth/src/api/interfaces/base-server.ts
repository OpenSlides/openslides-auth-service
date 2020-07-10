import * as http from 'http';

export abstract class BaseServer {
    public abstract getServer(): http.Server;
    public abstract getApp(): Express.Application;
}
