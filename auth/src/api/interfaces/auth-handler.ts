import { Id } from '../../core/key-transforms';
import { Ticket, Token } from '../../core/ticket';
import { JwtPayload } from '../../core/ticket/base-jwt';

export abstract class AuthHandler {
    public static readonly COOKIE_NAME = 'refreshId';
    public static readonly AUTHENTICATION_HEADER = 'authentication';
    public static readonly AUTHORIZATION_HEADER = 'authorization';
    public static readonly TOKEN_DB_KEY = 'tokens';

    public abstract login(username: string, password: string): Promise<Ticket>;
    public abstract doSamlLogin(userId: number): Promise<Ticket>;
    public abstract whoAmI(cookieAsString: string): Promise<Ticket>;
    public abstract createAuthorizationToken(payload: JwtPayload): string;
    public abstract verifyAuthorizationToken(token: string): Promise<Token>;
    public abstract logout(token: Token): Promise<void>;
    public abstract getListOfSessions(): Promise<string[]>;
    public abstract clearUserSessionById(sessionId: string): Promise<void>;
    public abstract clearAllSessionsExceptThemselves(sessionId: string): Promise<void>;
    public abstract clearAllSessions(userId: Id): Promise<void>;
    public abstract toHash(toHash: string): Promise<string>;
    public abstract isEquals(toHash: string, toCompare: string): Promise<boolean>;
}
