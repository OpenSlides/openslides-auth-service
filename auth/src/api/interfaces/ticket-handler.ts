import { User } from '../../core/models/user';
import { Cookie, Ticket, Token } from '../../core/ticket';

export abstract class TicketHandler {
    /**
     * Verifies the signature of a signed cookie.
     *
     * @param cookieAsString A cookie to verify as signed string
     * @returns the decoded cookie.
     */
    public abstract verifyCookie(cookieAsString: string): Cookie;
    public abstract verifyToken(tokenAsString: string): Token;
    public abstract decode<T>(toDecode: string): T;
    public abstract create(user: User): Promise<Ticket>;
    public abstract refresh(cookie?: string): Promise<Ticket>;
    public abstract validateTicket(token?: string, cookie?: string): Promise<Ticket>;
}
