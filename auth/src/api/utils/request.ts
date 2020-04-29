import * as express from 'express';

import { Cookie, Token } from '../interfaces/generator';

export interface Request extends express.Request {
    token: Token;
    cookie: Cookie;
}
