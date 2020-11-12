import { Cookie, Ticket, Token } from '../../core/ticket';
import { User } from '../../core/models/user';
import { Validation } from './validation';

export abstract class TicketHandler {
    public abstract verifyCookie(cookieAsString: string): Validation<Cookie>;
    public abstract verifyToken(tokenAsString: string): Validation<Token>;
    public abstract decode<T>(toDecode: string): T;
    public abstract create(user: User): Promise<Validation<Ticket>>;
    public abstract refresh(cookie?: string): Promise<Validation<Ticket>>;
    public abstract validateTicket(token?: string, cookie?: string): Promise<Validation<Token>>;
}
