import { Id } from 'src/core/key-transforms';

import { Cookie, Ticket, Token } from '../../core/ticket';
import { JwtPayload } from '../../core/ticket/base-jwt';

export abstract class TicketHandler {
    /**
     * Decodes the payload of a jwt which is encoded in Base64. This function does not verifies the signature
     * of the jwt.
     *
     * @param toDecode The encoded jwt as string
     *
     * @returns The payload as object
     */
    public abstract decode<T>(toDecode: string): T;
    /**
     * Creates a new ticket (this includes a token and a cookie)
     *
     * @param userId The id of a user
     * @param session A session of the user
     *
     * @returns the new ticket
     */
    public abstract create(userId: Id, session: string): Ticket;
    /**
     * Creates a new instance of a `BaseJwt`. It is either a `Token` or a `Cookie`.
     *
     * @param payload The payload of the Token or Cookie
     * @param type The type of the BaseJwt - either `token` or `cookie`.
     *
     * @returns The instance of a `BaseJwt` - either a `Token` or a `Cookie`
     */
    public abstract createJwt(payload: JwtPayload, type?: 'token' | 'cookie'): Token | Cookie;
    /**
     * Creates a new `Ticket` by creating a new `Token` according to the passed `Cookie`
     *
     * @param cookie An instance of `Cookie` which contains `userId` and `sessionId`
     *
     * @returns A `Ticket` (containing `token` and `cookie`)
     */
    public abstract refresh(cookie: Cookie): Ticket;
    /**
     * Verifies the signature of a jwt and returns the payload.
     *
     * @param tokenEncoded The encoded jwt (as string)
     * @param type The type of the jwt. It is either a `cookie` or a `token`.
     *
     * @returns An instance of a `Token` or a `Cookie`.
     */
    public abstract verifyJwt(tokenEncoded: string, type?: 'token' | 'cookie'): Token | Cookie;
    /**
     * This verifies a whole `Ticket`. Meaning, it expects an encoded token and an encoded cookie,
     * checks that the both are `Bearer `-jwts and verifies their signatures. If everything is successful,
     * then it returns their decoded payload as instance of a `Token` and a `Cookie` (it returns them as a `Ticket`).
     *
     * @param tokenEncoded An encoded jwt from a token
     * @param cookieEncoded An encoded jwt from a cookie
     *
     * @returns A `Ticket` containing the decoded payload of the given `Token` and `Cookie`
     */
    public abstract verifyTicket(tokenEncoded: string, cookieEncoded: string): Ticket;
}
