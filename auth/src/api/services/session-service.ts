import { Database } from '../interfaces/database';
import { Inject } from '../../util/di';
import { Random } from '../../util/helper';
import { RedisDatabaseAdapter } from '../../adapter/redis-database-adapter';
import { SessionHandler } from '../interfaces/session-handler';
import { User } from '../../core/models/user';

export class SessionService implements SessionHandler {
    @Inject(RedisDatabaseAdapter)
    private database: Database;

    public async getAllActiveSessions(): Promise<string[]> {
        return await this.database.keys(SessionHandler.SESSION_KEY);
    }

    public async getUserIdBySessionId(sessionId: string): Promise<string | null> {
        return await this.database.get(SessionHandler.SESSION_KEY, sessionId);
    }

    public async clearSessionById(sessionId: string): Promise<boolean> {
        return await this.database.remove(SessionHandler.SESSION_KEY, sessionId);
    }

    public async clearSessionsFromUser(userId: string): Promise<void> {
        await this.database.removeAllByFn(SessionHandler.SESSION_KEY, (key, value) => value === userId);
    }

    public async clearAllSessionsExceptThemselves(exceptUserId: string): Promise<boolean> {
        return await this.database.removeAllByFn(SessionHandler.SESSION_KEY, (key, value) => value !== exceptUserId);
    }

    public async hasSession(sessionId: string): Promise<boolean> {
        return !!(await this.database.get(SessionHandler.SESSION_KEY, sessionId));
    }

    public async addSession(user: User): Promise<string> {
        const newSession = Random.cryptoKey();
        await this.database.set(SessionHandler.SESSION_KEY, newSession, user.id);
        return newSession;
    }
}
