import { InjectableClass } from '../../util/di';
import { Validation } from './jwt-validator';
import { Cookie, Ticket } from '../../core/ticket';

export abstract class AuthHandler extends InjectableClass {
    public abstract login(username: string, password: string): Promise<Validation<Ticket>>;
    public abstract whoAmI(cookieAsString: string): Promise<Validation<Ticket>>;
    public abstract logout(cookie: Cookie): void;
    public abstract getListOfSessions(): string[];
    public abstract clearSessionById(cookie: Cookie): void;
    public abstract clearAllSessionsExceptThemselves(cookie: Cookie): void;
    public abstract toHash(toHash: string): string;
}
