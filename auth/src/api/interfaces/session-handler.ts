import { Id } from '../../core/key-transforms';
import { User } from '../../core/models/user';

export abstract class SessionHandler {
    public static readonly SESSION_KEY = 'session:sessions';
    public static readonly USER_KEY = 'session:users';

    /**
     * Gets an array with current signed in users.
     *
     * @returns An array, that contains current active user-ids.
     */
    public abstract getAllActiveUsers(): Promise<string[]>;

    public abstract getAllActiveSessions(): Promise<string[]>;

    /**
     * Function to remove a specified session.
     *
     * @param sessionId The session that should be removed.
     */
    public abstract clearSessionById(sessionId: string): Promise<void>;

    /**
     * Removes the current active sessions of one user except the passed one.
     *
     * @param exceptSessionId The sessionId that is not removed.
     */
    public abstract clearAllSessionsExceptThemselves(exceptSessionId: string): Promise<void>;
    public abstract clearAllSessions(userId: Id): Promise<void>;
    public abstract hasSession(sessionId: string): Promise<boolean>;
    public abstract getUserIdBySessionId(sessionId: string): Promise<string>;

    /**
     * Function, that handles adding and returning of new sessions.
     * Called, if a user signs in.
     *
     * @param user The user, who signs in.
     *
     * @returns The new created session.
     */
    public abstract addSession(user: User): Promise<string>;
}
