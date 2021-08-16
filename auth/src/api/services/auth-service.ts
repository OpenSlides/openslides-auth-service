import { Factory, Inject } from 'final-di';

import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { Ticket, Token } from '../../core/ticket';
import { AuthHandler } from '../interfaces/auth-handler';
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

    public async login(username: string, password: string): Promise<Ticket> {
        if (!username || !password) {
            throw new AuthenticationException('Authentication failed! Username or password is not provided!');
        }
        const user = await this._userHandler.getUserByCredentials(username, password);
        return await this._ticketHandler.create(user);
    }

    public async whoAmI(cookieAsString: string): Promise<Ticket> {
        Logger.debug(`whoAmI -- cookie: ${cookieAsString}`);
        return await this._ticketHandler.refresh(cookieAsString);
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

    public toHash(input: string): string {
        return this._hashHandler.hash(input);
    }

    public isEquals(toHash: string, toCompare: string): boolean {
        return this._hashHandler.isEquals(toHash, toCompare);
    }
}
