import { exception } from 'console';

import { Constructable } from '../../util/di';
import { Validation } from '../interfaces/jwt-validator';
import { SessionHandler } from '../interfaces/session-handler';
import { Cookie } from '../../core/ticket';
import { TokenService } from './token-service';
import { User } from '../../core/models/user';

@Constructable(SessionHandler)
export default class SessionService implements SessionHandler {
    public name = 'SessionHandler';

    private activeSessions: Map<string, User> = new Map();

    public isValid(token: string): Validation<Cookie> {
        const result = TokenService.verifyCookie(token);
        if (!result.isValid) {
            return { isValid: false, message: 'The cookie is wrong' };
        }
        if (result.result && !this.activeSessions.has(result.result.sessionId)) {
            return { isValid: false, message: 'Not logged in!' };
        }
        return result;
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
