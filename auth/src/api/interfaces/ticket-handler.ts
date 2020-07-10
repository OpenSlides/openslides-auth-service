import { InjectableClass } from '../../util/di';
import { JwtValidator, Validation } from './jwt-validator';
import { Cookie, Ticket, Token } from '../../core/ticket';
import { User } from '../../core/models/user';

export abstract class TicketHandler extends InjectableClass implements JwtValidator {
    public abstract verifyCookie: (cookieAsString: string) => Validation<Cookie>;
    public abstract verifyToken: (tokenAsString: string) => Validation<Token>;
    public abstract decode: <T>(toDecode: string) => T;
    public abstract create: (user: User) => Promise<Validation<Ticket>>;
    public abstract refresh: (cookie: string, sessionId: string, user: User) => Promise<Validation<Ticket>>;
    public abstract refreshToken: (cookie: string) => Promise<Validation<Ticket>>;
    public abstract isValid: (jwt: string) => boolean;
}
