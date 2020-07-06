import { InjectableClass } from '../../util/di';
import { IsValid } from './is-valid';
import { Cookie, Ticket, Token } from '../../core/ticket';
import { User } from '../../core/models/user/user';

export abstract class TokenHandler extends InjectableClass implements IsValid<Token> {
    public static verifyCookie: () => Cookie;
    public static verifyToken: () => Token;
    public static decode: <T>() => T;
    public abstract create: (user: User) => Promise<Ticket>;
    public abstract refresh: (cookie: string, sessionId: string, user: User) => Promise<Ticket>;
    public abstract isValid: (token: string) => Token | undefined;
}
