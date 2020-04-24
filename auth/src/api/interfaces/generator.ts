import Client from '../../core/models/client/client';
import { InjectableClass } from '../../core/modules/decorators';

export interface Token {
    payload: {
        expiresAt: Date;
        userId: number;
        sessionId: string;
    };
    signature: string;
}

export interface Cookie {
    sessionId: string;
    signature: string;
}

export interface Response {
    cookie: string;
    token: string;
    client: Client;
}

export class Generator extends InjectableClass {
    public createTicket: (username: string, password: string) => Promise<Response>;
    public renewTicket: (cookie: string) => Promise<Response>;
    public verifyCookie: (cookie: string) => Cookie;
}
