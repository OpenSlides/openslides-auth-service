import { User } from '../../core/models/user';

export abstract class SessionHandler {
    public static readonly SESSION_KEY = 'session';

    public abstract async getAllActiveSessions(): Promise<string[]>;
    /**
     * Function to remove a specified session.
     *
     * @param sessionId The session that should be removed.
     *
     * @returns A boolean, if it was successful.
     */
    public abstract async clearSessionById(sessionId: string): Promise<boolean>;

    /**
     * Function to explicit signs out one user by a given id.
     *
     * @param userId The id of the user who should be signed out in all clients.
     */
    public abstract async clearSessionsFromUser(userId: string): Promise<void>;
    public abstract async clearAllSessionsExceptThemselves(exceptSessionId: string): Promise<boolean>;
    public abstract async hasSession(sessionId: string): Promise<boolean>;
    public abstract async getUserIdBySessionId(sessionId: string): Promise<string | null>;

    /**
     * Function, that handles adding and returning of new sessions.
     * Called, if a user signs in.
     *
     * @param user The user, who signs in.
     *
     * @returns The new created session.
     */
    public abstract async addSession(user: User): Promise<string>;
}
