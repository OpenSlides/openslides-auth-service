import { InjectableClass } from '../../util/di';
import { IsValid } from './is-valid';
import { Cookie, Token, Ticket } from '../../core/ticket';
import { User } from '../../core/models/user/user';

export class TokenHandler extends InjectableClass implements IsValid<Token> {
    public static verifyCookie: () => Cookie;
    public static verifyToken: () => Token;
    public static decode: <T>() => T;
    public create: (user: User) => Promise<Ticket>;
    public refresh: (cookie: string, sessionId: string, user: User) => Promise<Ticket>;
    public isValid: (token: string) => Token | undefined;
}
