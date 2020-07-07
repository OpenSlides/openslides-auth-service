import { InjectableClass } from '../../util/di';
import { JwtValidator, Validation } from './jwt-validator';
import { Cookie } from '../../core/ticket';
import { User } from '../../core/models/user';

export abstract class SessionHandler extends InjectableClass implements JwtValidator<Cookie> {
    public abstract getAllActiveSessions(): string[];
    public abstract clearSessionById(sessionId: string): boolean;
    public abstract clearAllSessionsExceptThemselves(exceptSessionId: string): boolean;
    public abstract hasSession(sessionId: string): boolean;
    public abstract addSession(user: User): boolean;
    public abstract isValid(jwt: string): Validation<Cookie>;
}
