import { InjectableClass } from '../../util/di';
import { JwtValidator, Validation } from './jwt-validator';
import { Cookie } from '../../core/ticket';
import { User } from '../../core/models/user';

export abstract class SessionHandler extends InjectableClass {
    public abstract getAllActiveSessions(): string[];
    public abstract clearSessionById(sessionId: string): boolean;
    public abstract clearAllSessionsExceptThemselves(exceptSessionId: string): boolean;
    public abstract hasSession(sessionId: string): boolean;
    public abstract getUserIdBySessionId(sessionId: string): string | null;

    /**
     * Function, that handles adding and returning of new sessions.
     * Called, if a user signs in.
     *
     * @param user The user, who signs in.
     *
     * @returns The new created session.
     */
    public abstract addSession(user: User): string;
    // public abstract isValid(jwt: string): Validation<Cookie>;
}
