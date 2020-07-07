import { exception } from 'console';

import { AuthHandler } from '../interfaces/auth-handler';
import { Inject, InjectService, Constructable } from '../../util/di';
import { HashingHandler } from '../interfaces/hashing-handler';
import { HashingService } from './hashing-service';
import SessionService from './session-service';
import { Cookie, Ticket } from '../../core/ticket';
import { TokenHandler } from '../interfaces/token-handler';
import { TokenService } from './token-service';
import { UserHandler } from '../interfaces/user-handler';
import { UserService } from './user-service';
import { Validation } from '../interfaces/jwt-validator';
import { Logger } from './logger';

@Constructable(AuthHandler)
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

    public async login(username: string, password: string): Promise<Validation<Ticket>> {
        console.log('login', username, password);
        if (!username || !password) {
            return { isValid: false, message: 'Authentication failed! No username or password provided!' };
            // throw new Error('Authentication failed! No username or password provided!');
        }

        if (!(await this.userService.hasUser(username))) {
            // throw new Error('Incorrect username or password!');
            return { isValid: false, message: 'Incorrect username or password!' };
        }

        const user = await this.userService.getUserByCredentials(username, password);
        // console.log('user', user);
        Logger.log(`user: ${user}`);
        if (!user) {
            return { isValid: false, message: 'Something went wrong!' };
            // throw new Error('Something went wrong');
        }

        this.sessionHandler.addSession(user);
        return await this.tokenHandler.create(user);
    }

    public async whoAmI(cookieAsString: string): Promise<Validation<Ticket>> {
        const result = this.sessionHandler.isValid(cookieAsString);
        if (!result.result) {
            return { isValid: false, message: 'No cookie provided!' };
            // throw new Error('No cookie provided');
        }
        // if (!result.result) {
        //     return {isValid: false, message: ''}
        // }
        const user = await this.userService.getUserBySessionId(result.result.sessionId);
        if (!user) {
            return { isValid: false, message: 'Wrong user!' };
            // throw new Error('Wrong user');
        }
        return await this.tokenHandler.refresh(cookieAsString, result.result.sessionId, user);
    }

    public logout(cookie: Cookie): void {
        if (!cookie) {
            throw new Error('No cookie provided');
        }
        if (!this.sessionHandler.clearSessionById(cookie.sessionId)) {
            throw new Error('Wrong cookie!');
        }
    }

    public getListOfSessions(): string[] {
        return this.sessionHandler.getAllActiveSessions();
    }

    public clearSessionById(cookie: Cookie): void {
        if (!this.sessionHandler.clearSessionById(cookie.sessionId)) {
            throw new Error('You have no permission!');
        }
    }

    public clearAllSessionsExceptThemselves(cookie: Cookie): void {
        if (!this.sessionHandler.clearAllSessionsExceptThemselves(cookie.sessionId)) {
            throw new Error('You have no permission!');
        }
    }

    public toHash(input: string): string {
        return this.hashHandler.hash(input);
    }
}
