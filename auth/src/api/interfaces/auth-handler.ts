import { InjectableClass } from '../../util/di';
import { Cookie, Ticket } from '../../core/ticket';
import { Validation } from './jwt-validator';

export abstract class AuthHandler extends InjectableClass {
    public abstract login: (username: string, password: string) => Promise<Validation<Ticket>>;
    public abstract whoAmI: (cookieAsString: string) => Promise<Validation<Ticket>>;
    public abstract logout: (cookie: Cookie) => void;
    public abstract getListOfSessions: () => string[];
    public abstract clearSessionById: (cookie: Cookie) => void;
    public abstract clearAllSessionsExceptThemselves: (cookie: Cookie) => void;
}
