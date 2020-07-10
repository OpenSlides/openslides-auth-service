import { AuthHandler } from '../interfaces/auth-handler';
import { Inject, InjectService } from '../../util/di';
import { HashingHandler } from '../interfaces/hashing-handler';
import { HashingService } from './hashing-service';
import { Logger } from './logger';
import { SessionService } from './session-service';
import { Ticket, Token } from '../../core/ticket';
import { TicketHandler } from '../interfaces/ticket-handler';
import { TicketService } from './ticket-service';
import { UserHandler } from '../interfaces/user-handler';
import { UserService } from './user-service';
import { Validation } from '../interfaces/validation';

export class AuthService implements AuthHandler {
    @Inject(UserService)
    private userService: UserHandler;

    @Inject(TicketService)
    private ticketHandler: TicketHandler;

    @Inject(HashingService)
    private hashHandler: HashingHandler;

    @InjectService(SessionService)
    private sessionHandler: SessionService;

    public async login(username: string, password: string): Promise<Validation<Ticket>> {
        if (!username || !password) {
            return { isValid: false, message: 'Authentication failed! No username or password provided!' };
        }

        if (!(await this.userService.hasUser(username))) {
            return { isValid: false, message: 'Incorrect username or password!' };
        }

        const result = await this.userService.getUserByCredentials(username, password);
        Logger.log(`user:`, result.result);
        if (!result.result) {
            return { isValid: false, message: result.message };
        }

        return await this.ticketHandler.create(result.result);
    }

    public async whoAmI(cookieAsString: string): Promise<Validation<Ticket>> {
        return await this.ticketHandler.refresh(cookieAsString);
    }

    public logout(token: Token): Validation<void> {
        if (!token) {
            return { isValid: false, message: 'No token provided!' };
        }
        if (!this.sessionHandler.clearSessionById(token.userId)) {
            return { isValid: false, message: 'Wrong token!' };
        }
        return { isValid: true, message: 'successful' };
    }

    public getListOfSessions(): string[] {
        return this.sessionHandler.getAllActiveSessions();
    }

    public clearUserSessionByUserId(userId: string): Validation<void> {
        if (!this.sessionHandler.clearSessionById(userId)) {
            return { isValid: false, message: 'You have no permissions!' };
        }
        return { isValid: true, message: 'successful' };
    }

    public clearAllSessionsExceptThemselves(userId: string): Validation<void> {
        if (!this.sessionHandler.clearAllSessionsExceptThemselves(userId)) {
            return { isValid: false, message: 'You have no permissions!' };
        }
        return { isValid: true, message: 'successful' };
    }

    public toHash(input: string): string {
        return this.hashHandler.hash(input);
    }
}
