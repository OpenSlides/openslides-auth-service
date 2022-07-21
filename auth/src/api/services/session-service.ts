import { Factory } from 'final-di';

import { RedisDatabaseAdapter } from '../../adapter/redis-database-adapter';
import { RedisMessageBusAdapter } from '../../adapter/redis-message-bus-adapter';
import { User } from '../../core/models/user';
import { Random } from '../../util/helper';
import { Database } from '../interfaces/database';
import { MessageBus } from '../interfaces/message-bus';
import { SessionHandler } from '../interfaces/session-handler';
import { Logger } from '../services/logger';

export class SessionService extends SessionHandler {
    @Factory(RedisDatabaseAdapter, SessionHandler.SESSION_KEY)
    private readonly _sessionDatabase: Database;

    @Factory(RedisDatabaseAdapter, SessionHandler.USER_KEY)
    private readonly _userDatabase: Database;

    @Factory(RedisMessageBusAdapter)
    private readonly _messageBus: MessageBus;

    private _logMetric = setInterval(
        (sessionService: SessionService) => {
            Promise.all([sessionService.getAllActiveSessions(), sessionService.getAllActiveUsers()])
                .then(values => {
                    const allActiveSessions = values[0].length;
                    const allActiveUsers = values[1].length;
                    Logger.log(`Metric: {"sessions":${allActiveSessions},"users":${allActiveUsers}}`);
                })
                .catch(() => Logger.error('Could not log the number of active sessions and users.'));
        },
        60000,
        this
    );

    public async getAllActiveSessions(): Promise<string[]> {
        return await this._sessionDatabase.keys();
    }

    public async getAllActiveUsers(): Promise<string[]> {
        return await this._userDatabase.keys();
    }

    public async getUserIdBySessionId(sessionId: string): Promise<string> {
        return await this._sessionDatabase.get(sessionId);
    }

    public async clearSessionById(sessionId: string): Promise<void> {
        const userId = await this._sessionDatabase.get<string>(sessionId);
        const currentSessions = await this._userDatabase.get<string[]>(userId);
        if (currentSessions && !!currentSessions.length) {
            currentSessions.splice(
                currentSessions.findIndex(session => session === sessionId),
                1
            );
        }
        await this._userDatabase.set(userId, currentSessions);
        await this.removeSession(sessionId);
    }

    public async clearAllSessionsExceptThemselves(exceptSessionId: string): Promise<void> {
        const userId = await this._sessionDatabase.get<string>(exceptSessionId);
        const currentSessions = (await this._userDatabase.get<string[]>(userId)) || [];
        await Promise.all(
            currentSessions.map(session => {
                if (session !== exceptSessionId) {
                    return this.removeSession(session);
                }
            })
        );
        await this._userDatabase.set(userId, [exceptSessionId]);
    }

    public async hasSession(sessionId: string): Promise<boolean> {
        return !!(await this._sessionDatabase.get(sessionId));
    }

    public async addSession(user: User): Promise<string> {
        const currentSessions = (await this._userDatabase.get<string[]>(user.id)) || [];
        const newSession = Random.cryptoKey();
        currentSessions.push(newSession);
        await Promise.all([
            this._sessionDatabase.set(newSession, user.id),
            this._userDatabase.set(user.id, currentSessions)
        ]);
        return newSession;
    }

    private async removeSession(sessionId: string): Promise<void> {
        await Promise.all([
            this._sessionDatabase.remove(sessionId),
            this._messageBus.sendEvent('logout', 'sessionId', sessionId)
        ]).catch(reason => console.log('could not remove session:', reason));
    }
}
