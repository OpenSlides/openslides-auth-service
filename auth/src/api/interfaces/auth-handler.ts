import { InjectableClass } from '../../util/di';
import { Validation } from './jwt-validator';
import { Cookie, Ticket, Token } from '../../core/ticket';

export abstract class AuthHandler extends InjectableClass {
    public abstract login(username: string, password: string): Promise<Validation<Ticket>>;
    public abstract whoAmI(cookieAsString: string): Promise<Validation<Ticket>>;
    public abstract logout(token: Token): void;
    public abstract getListOfSessions(): string[];
    public abstract clearUserSessionByUserId(userId: string): void;
    public abstract clearAllSessionsExceptThemselves(userId: string): void;
    public abstract toHash(toHash: string): string;
}
