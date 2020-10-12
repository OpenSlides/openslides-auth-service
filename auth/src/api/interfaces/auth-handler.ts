import { Ticket, Token } from '../../core/ticket';
import { Validation } from './validation';

export abstract class AuthHandler {
    public static readonly COOKIE_NAME = 'refreshId';

    public abstract login(username: string, password: string): Promise<Validation<Ticket>>;
    public abstract whoAmI(cookieAsString: string): Promise<Validation<Ticket>>;
    public abstract logout(token: Token): void;
    public abstract getListOfSessions(): Promise<string[]>;
    public abstract clearUserSessionById(sessionId: string): Promise<Validation<void>>;
    public abstract clearAllSessionsExceptThemselves(sessionId: string): Promise<Validation<void>>;
    public abstract toHash(toHash: string): string;
    public abstract isEquals(toHash: string, toCompare: string): boolean;
}
