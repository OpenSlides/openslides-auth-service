import { exception } from 'console';

import { Constructable } from '../../util/di';
import SessionHandler from '../interfaces/session-handler';
import { Cookie } from '../../core/ticket';
import { TokenService } from './token-service';
import { User } from '../../core/models/user/user';

@Constructable(SessionHandler)
export default class SessionService implements SessionHandler {
    public name = 'SessionHandler';

    private activeSessions: Map<string, User> = new Map();

    public isValid(token: string): Cookie | undefined {
        try {
            const cookie = TokenService.verifyCookie(token);
            if (!this.activeSessions.has(cookie.sessionId)) {
                throw exception('Not logged in!');
            }
            return cookie;
        } catch {
            throw exception('The cookie is wrong');
        }
    }

    public getAllActiveSessions(): string[] {
        return Array.from(this.activeSessions.keys());
    }

    public clearSessionById(sessionId: string): boolean {
        if (this.activeSessions.has(sessionId)) {
            this.activeSessions.delete(sessionId);
            return true;
        } else {
            return false;
        }
    }

    public clearAllSessionsExceptThemselves(exceptSessionId: string): boolean {
        const sessions = this.getAllActiveSessions().filter(session => session !== exceptSessionId);
        for (const session of sessions) {
            this.activeSessions.delete(session);
        }
        return true;
    }

    public hasSession(sessionId: string): boolean {
        return this.activeSessions.has(sessionId);
    }

    public addSession(user: User): boolean {
        if (!this.hasSession(user.sessionId)) {
            this.activeSessions.set(user.sessionId, user);
            return true;
        } else {
            return false;
        }
    }
}
