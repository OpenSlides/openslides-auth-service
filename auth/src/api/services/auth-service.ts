import { AuthHandler } from '../interfaces/auth-handler';
import { Inject, InjectService } from '../../util/di';
import { HashingHandler } from '../interfaces/hashing-handler';
import { HashingService } from './hashing-service';
import { SessionService } from './session-service';
import { Ticket, Token } from '../../core/ticket';
import { TicketHandler } from '../interfaces/ticket-handler';
import { TicketService } from './ticket-service';
import { UserHandler } from '../interfaces/user-handler';
import { UserService } from './user-service';
import { Validation } from '../interfaces/validation';

export class AuthService implements AuthHandler {
    @Inject(UserService)
    private userHandler: UserHandler;

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

        if (!(await this.userHandler.hasUser(username))) {
            return { isValid: false, message: 'Incorrect username or password!' };
        }

        const result = await this.userHandler.getUserByCredentials(username, password);
        if (!result.result) {
            return { isValid: false, message: result.message };
        }

        return await this.ticketHandler.create(result.result);
    }

    public async whoAmI(cookieAsString: string): Promise<Validation<Ticket>> {
        const answer = await this.ticketHandler.refresh(cookieAsString);
        return answer;
    }

    public logout(token: Token): void {
        this.sessionHandler.clearSessionById(token.sessionId);
    }

    public async getListOfSessions(): Promise<string[]> {
        return await this.sessionHandler.getAllActiveSessions();
    }

    public async clearUserSessionByUserId(userId: string): Promise<Validation<void>> {
        const result = await this.userHandler.getUserByUserId(userId);
        if (!result.result) {
            return { isValid: false, message: 'No user' };
        }
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
