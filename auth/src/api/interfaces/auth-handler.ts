import { InjectableClass } from '../../util/di';
import { Cookie, Ticket } from '../../core/ticket';

export abstract class AuthHandler extends InjectableClass {
    public abstract login: (username: string, password: string) => Promise<Ticket>;
    public abstract whoAmI: (cookieAsString: string) => Promise<Ticket>;
    public abstract logout: (cookie: Cookie) => void;
    public abstract getListOfSessions: () => string[];
    public abstract clearSessionById: (cookie: Cookie) => void;
    public abstract clearAllSessionsExceptThemselves: (cookie: Cookie) => void;
}
