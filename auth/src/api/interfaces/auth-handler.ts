import { InjectableClass } from '../../util/di';
import { Ticket, Cookie } from '../../core/ticket';

export class AuthHandler extends InjectableClass {
    public login: (username: string, password: string) => Promise<Ticket>;
    public whoAmI: (cookieAsString: string) => Promise<Ticket>;
    public logout: (cookie: Cookie) => void;
    public getListOfSessions: () => string[];
    public clearSessionById: (cookie: Cookie) => void;
    public clearAllSessionsExceptThemselves: (cookie: Cookie) => void;
}
