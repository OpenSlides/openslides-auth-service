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
        }

        if (!(await this.userService.hasUser(username))) {
            return { isValid: false, message: 'Incorrect username or password!' };
        }

        const result = await this.userService.getUserByCredentials(username, password);
        Logger.log(`user: ${result.result}`);
        if (!result.result) {
            return { isValid: false, message: result.message };
        }

        this.sessionHandler.addSession(result.result);
        return await this.tokenHandler.create(result.result);
    }

    public async whoAmI(cookieAsString: string): Promise<Validation<Ticket>> {
        const result = this.sessionHandler.isValid(cookieAsString);
        if (!result.result) {
            return { isValid: false, message: 'No cookie provided!' };
        }
        const userResult = await this.userService.getUserBySessionId(result.result.sessionId);
        if (!userResult.result) {
            return { isValid: false, message: 'Wrong user!' };
        }
        return await this.tokenHandler.refresh(cookieAsString, result.result.sessionId, userResult.result);
    }

    public logout(cookie: Cookie): Validation<void> {
        if (!cookie) {
            return { isValid: false, message: 'No cookie provided!' };
        }
        if (!this.sessionHandler.clearSessionById(cookie.sessionId)) {
            return { isValid: false, message: 'Wrong cookie!' };
        }
        return { isValid: true, message: 'successful' };
    }

    public getListOfSessions(): string[] {
        return this.sessionHandler.getAllActiveSessions();
    }

    public clearSessionById(cookie: Cookie): Validation<void> {
        if (!this.sessionHandler.clearSessionById(cookie.sessionId)) {
            return { isValid: false, message: 'You have no permissions!' };
        }
        return { isValid: true, message: 'successful' };
    }

    public clearAllSessionsExceptThemselves(cookie: Cookie): Validation<void> {
        if (!this.sessionHandler.clearAllSessionsExceptThemselves(cookie.sessionId)) {
            return { isValid: false, message: 'You have no permissions!' };
        }
        return { isValid: true, message: 'successful' };
    }

    public toHash(input: string): string {
        return this.hashHandler.hash(input);
    }
}
