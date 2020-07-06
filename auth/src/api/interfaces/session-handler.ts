import { InjectableClass } from '../../util/di';
import { IsValid } from './is-valid';
import { Cookie } from '../../core/ticket';
import { User } from '../../core/models/user/user';

export default class SessionHandler extends InjectableClass implements IsValid<Cookie> {
    public getAllActiveSessions: () => string[];
    public clearSessionById: (sessionId: string) => boolean;
    public clearAllSessionsExceptThemselves: (exceptSessionId: string) => boolean;
    public hasSession: (sessionId: string) => boolean;
    public addSession: (user: User) => boolean;
    public isValid: (token: string) => Cookie | undefined;
}
