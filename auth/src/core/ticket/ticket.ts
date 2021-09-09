import { Cookie } from './cookie';
import { Token } from './token';

export interface Ticket {
    token: Token;
    cookie: Cookie;
}
