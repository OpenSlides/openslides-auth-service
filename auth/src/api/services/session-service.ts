import { Database } from '../interfaces/database';
import { Inject } from '../../util/di';
import { Random } from '../../util/helper';
import { MessageBus } from '../interfaces/message-bus';
import { RedisDatabaseAdapter } from '../../adapter/redis-database-adapter';
import { RedisMessageBusAdapter } from '../../adapter/redis-message-bus-adapter';
import { SessionHandler } from '../interfaces/session-handler';
import { User } from '../../core/models/user';

export class SessionService extends SessionHandler {
    @Inject(RedisDatabaseAdapter, SessionHandler.SESSION_KEY)
    private sessionDatabase: Database;

    @Inject(RedisDatabaseAdapter, SessionHandler.USER_KEY)
    private userDatabase: Database;

    @Inject(RedisMessageBusAdapter)
    private messageBus: MessageBus;

    public async getAllActiveSessions(): Promise<string[]> {
        return await this.sessionDatabase.keys();
    }

    public async getAllActiveUsers(): Promise<string[]> {
        return await this.userDatabase.keys();
    }

    public async getUserIdBySessionId(sessionId: string): Promise<string> {
        return await this.sessionDatabase.get(sessionId);
    }

    public async clearSessionById(sessionId: string): Promise<void> {
        const userId = await this.sessionDatabase.get<string>(sessionId);
        const currentSessions = await this.userDatabase.get<string[]>(userId);
        currentSessions.splice(
            currentSessions.findIndex(session => session === sessionId),
            1
        );
        await this.userDatabase.set(userId, currentSessions);
        await this.removeSession(sessionId);
    }

    public async clearAllSessionsExceptThemselves(exceptSessionId: string): Promise<void> {
        const userId = await this.sessionDatabase.get<string>(exceptSessionId);
        const currentSessions = await this.userDatabase.get<string[]>(userId);
        await Promise.all(
            currentSessions.map(session => {
                if (session !== exceptSessionId) {
                    return this.removeSession(session);
                }
            })
        );
        await this.userDatabase.set(userId, [exceptSessionId]);
    }

    public async hasSession(sessionId: string): Promise<boolean> {
        return !!(await this.sessionDatabase.get(sessionId));
    }

    public async addSession(user: User): Promise<string> {
        const currentSessions = (await this.userDatabase.get<string[]>(user.id)) || [];
        const newSession = Random.cryptoKey();
        currentSessions.push(newSession);
        await this.sessionDatabase.set(newSession, user.id);
        await this.userDatabase.set(user.id, currentSessions);
        return newSession;
    }

    private async removeSession(sessionId: string): Promise<void> {
        await Promise.all([this.sessionDatabase.remove(sessionId), this.messageBus.sendEvent('logout', sessionId)]);
    }
}
