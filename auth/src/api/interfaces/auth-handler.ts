import { Ticket, Token } from '../../core/ticket';

export abstract class AuthHandler {
    public static readonly COOKIE_NAME = 'refreshId';
    public static readonly AUTHENTICATION_HEADER = 'Authentication';

    public abstract login(username: string, password: string): Promise<Ticket>;
    public abstract whoAmI(cookieAsString: string): Promise<Ticket>;
    public abstract logout(token: Token): void;
    public abstract getListOfSessions(): Promise<string[]>;
    public abstract clearUserSessionById(sessionId: string): Promise<void>;
    public abstract clearAllSessionsExceptThemselves(sessionId: string): Promise<void>;
    public abstract toHash(toHash: string): string;
    public abstract isEquals(toHash: string, toCompare: string): boolean;
}
