import { InjectableClass } from '../../util/di';
import { IsValid } from './is-valid';
import { Cookie } from '../../core/ticket';
import { User } from '../../core/models/user/user';

export abstract class SessionHandler extends InjectableClass implements IsValid<Cookie> {
    public abstract getAllActiveSessions: () => string[];
    public abstract clearSessionById: (sessionId: string) => boolean;
    public abstract clearAllSessionsExceptThemselves: (exceptSessionId: string) => boolean;
    public abstract hasSession: (sessionId: string) => boolean;
    public abstract addSession: (user: User) => boolean;
    public abstract isValid: (token: string) => Cookie | undefined;
}
