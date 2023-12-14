import { Factory, Inject } from 'final-di';

import { RedisDatabaseAdapter } from '../../adapter/redis-database-adapter';
import { AnonymousException } from '../../core/exceptions/anonymous-exception';
import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { Id } from '../../core/key-transforms';
import { Ticket, Token } from '../../core/ticket';
import { JwtPayload } from '../../core/ticket/base-jwt';
import { Cookie } from '../../core/ticket/cookie';
import { AuthHandler } from '../interfaces/auth-handler';
import { Database } from '../interfaces/database';
import { HashingHandler } from '../interfaces/hashing-handler';
import { SessionHandler } from '../interfaces/session-handler';
import { TicketHandler } from '../interfaces/ticket-handler';
import { UserHandler } from '../interfaces/user-handler';
import { HashingService } from './hashing-service';
import { Logger } from './logger';
import { SessionService } from './session-service';
import { TicketService } from './ticket-service';
import { UserService } from './user-service';

export class AuthService implements AuthHandler {
    @Factory(UserService)
    private _userHandler: UserHandler;

    @Factory(TicketService)
    private _ticketHandler: TicketHandler;

    @Factory(HashingService)
    private _hashHandler: HashingHandler;

    @Inject(SessionService)
    private _sessionHandler: SessionHandler;

    @Factory(RedisDatabaseAdapter, AuthHandler.TOKEN_DB_KEY)
    private readonly _tokenDatabase: Database;

    public async login(username: string, password: string): Promise<Ticket> {
        if (!username || !password) {
            throw new AuthenticationException('Authentication failed! Username or password is not provided!');
        }
        const user = await this._userHandler.getUserByCredentials(username, password);
        if (!Object.keys(user).length) {
            throw new AuthenticationException('Wrong user');
        }
        const session = await this._sessionHandler.addSession(user);
        await this._userHandler.updateLastLogin(user.id);
        return this._ticketHandler.create(user.id, session);
    }

    public async doSamlLogin(userId: number): Promise<Ticket> {
        if (!userId) {
            throw new AuthenticationException('Authentication failed! Username is not provided!');
        }
        if (userId === -1) {
            throw new AuthenticationException('Authentication failed! Server could not save user.');
        }
        const user = await this._userHandler.getUserByUserId(userId);
        if (!Object.keys(user).length) {
            throw new AuthenticationException('Wrong user');
        }
        const session = await this._sessionHandler.addSession(user);
        await this._userHandler.updateLastLogin(user.id);
        return this._ticketHandler.create(user.id, session);
    }

    public async whoAmI(cookieAsString: string = ''): Promise<Ticket> {
        Logger.debug(`whoAmI -- cookie: ${cookieAsString}`);
        if (!cookieAsString) {
            throw new AnonymousException();
        }
        const cookie = this._ticketHandler.verifyJwt(cookieAsString, 'cookie') as Cookie;
        if (!(await this._sessionHandler.hasSession(cookie.sessionId))) {
            throw new AuthenticationException('Not signed in');
        }
        const user = await this._userHandler.getUserByUserId(cookie.userId);
        if (!user) {
            await this._sessionHandler.clearSessionById(cookie.sessionId);
            throw new AuthenticationException('Wrong user');
        }
        return this._ticketHandler.refresh(cookie);
    }

    public createAuthorizationToken(payload: JwtPayload): string {
        return this._ticketHandler.createJwt(payload).toString();
    }

    public async verifyAuthorizationToken(token: string): Promise<Token> {
        if (await this._tokenDatabase.get(token)) {
            throw new AuthenticationException('Token is already used');
        }
        const result = this._ticketHandler.verifyJwt(token);
        // set token as invalid
        await this._tokenDatabase.set(token, true, true);
        return result;
    }

    public async logout(token: Token): Promise<void> {
        await this._sessionHandler.clearSessionById(token.sessionId);
    }

    public async getListOfSessions(): Promise<string[]> {
        return await this._sessionHandler.getAllActiveSessions();
    }

    public async clearUserSessionById(sessionId: string): Promise<void> {
        await this._sessionHandler.clearSessionById(sessionId);
    }

    public async clearAllSessionsExceptThemselves(sessionId: string): Promise<void> {
        await this._sessionHandler.clearAllSessionsExceptThemselves(sessionId);
    }

    public async clearAllSessions(userId: Id): Promise<void> {
        await this._sessionHandler.clearAllSessions(userId);
    }

    public async toHash(input: string): Promise<string> {
        return await this._hashHandler.hash(input);
    }

    public async isEquals(toHash: string, toCompare: string): Promise<boolean> {
        return await this._hashHandler.isEquals(toHash, toCompare);
    }
}
