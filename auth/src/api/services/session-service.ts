import { Random } from '../../util/helper';
import { SessionHandler } from '../interfaces/session-handler';
import { User } from '../../core/models/user';

export class SessionService implements SessionHandler {
    private activeSessions: Map<string, string[]> = new Map();

    public getAllActiveSessions(): string[] {
        return Array.from(this.activeSessions.keys());
    }

    public getUserIdBySessionId(sessionId: string): string | null {
        for (const key of this.activeSessions.keys()) {
            if (this.activeSessions.get(key)?.some(session => session === sessionId)) {
                return key;
            }
        }
        return null;
    }

    public clearSessionById(userId: string): boolean {
        if (this.activeSessions.has(userId)) {
            this.activeSessions.delete(userId);
            return true;
        } else {
            return false;
        }
    }

    public clearAllSessionsExceptThemselves(exceptUserId: string): boolean {
        const sessions = this.getAllActiveSessions().filter(session => session !== exceptUserId);
        for (const session of sessions) {
            this.activeSessions.delete(session);
        }
        return true;
    }

    public hasSession(sessionId: string): boolean {
        return !!this.getUserIdBySessionId(sessionId);
    }

    public addSession(user: User): string {
        const newSession = Random.cryptoKey();
        user.addSession(newSession);
        this.activeSessions.set(user.id, user.sessions);
        return newSession;
    }
}
