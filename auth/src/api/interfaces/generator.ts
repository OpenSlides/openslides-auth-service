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
}

export class Generator extends InjectableClass {
    createTicket: (username: string, password: string) => Promise<Response>;
    renewTicket: (cookie: string) => Promise<Response>;
    verifyCookie: (cookie: string) => Cookie;
}
