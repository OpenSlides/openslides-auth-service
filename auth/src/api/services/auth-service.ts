import { exception } from 'console';

import { AuthHandler } from '../interfaces/auth-handler';
import { Inject, InjectService } from '../../util/di';
import { HashingHandler } from '../interfaces/hashing-handler';
import { HashingService } from './hashing-service';
import SessionService from './session-service';
import { Cookie, Ticket } from '../../core/ticket';
import { TokenHandler } from '../interfaces/token-handler';
import { TokenService } from './token-service';
import { UserHandler } from '../interfaces/user-handler';
import { UserService } from './user-service';

export class AuthService implements AuthHandler {
    public name = 'AuthService';
    @Inject(UserHandler)
    private userService: UserService;

    @Inject(TokenHandler)
    private tokenHandler: TokenService;

    @Inject(HashingHandler)
    private hashHandler: HashingService;

    @InjectService(SessionService)
    private sessionHandler: SessionService;

    public async login(username: string, password: string): Promise<Ticket> {
        if (!username || !password) {
            throw exception('Authentication failed! No username or password provided!');
        }

        if (!this.userService.hasUser(username, password)) {
            throw exception('Incorrect username or password!');
        }

        const user = await this.userService.getUserByCredentials(username, password);
        if (!user) {
            throw exception('Something went wrong');
        }

        this.sessionHandler.addSession(user);
        return await this.tokenHandler.create(user);
    }
    public async whoAmI(cookieAsString: string): Promise<Ticket> {
        const cookie = this.sessionHandler.isValid(cookieAsString);
        if (!cookie) {
            throw exception('No cookie provided');
        }
        const user = await this.userService.getUserBySessionId(cookie.sessionId);
        if (!user) {
            throw exception('Wrong user');
        }
        return await this.tokenHandler.refresh(cookieAsString, cookie.sessionId, user);
    }
    public logout(cookie: Cookie): void {
        if (!cookie) {
            throw exception('No cookie provided');
        }
        if (!this.sessionHandler.clearSessionById(cookie.sessionId)) {
            throw exception('Wrong cookie!');
        }
    }
    public getListOfSessions(): string[] {
        return this.sessionHandler.getAllActiveSessions();
    }
    public clearSessionById(cookie: Cookie): void {
        if (!this.sessionHandler.clearSessionById(cookie.sessionId)) {
            throw exception('You have no permission!');
        }
    }
    public clearAllSessionsExceptThemselves(cookie: Cookie): void {
        if (!this.sessionHandler.clearAllSessionsExceptThemselves(cookie.sessionId)) {
            throw exception('You have no permission!');
        }
    }

    public toHash(input: string): string {
        return this.hashHandler.hash(input);
    }
}
