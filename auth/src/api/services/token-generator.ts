import jwt from 'jsonwebtoken';

import { Keys } from '../../config';
import { Constructable } from '../../core/modules/decorators';
import { Generator, Response } from '../interfaces/generator';
import { cryptoKey } from '../../core/modules/helper';
import { User } from '../../core/models/user/user';

@Constructable(Generator)
export default class TokenGenerator implements Generator {
    public name = 'TokenGenerator';

    public async createTicket(user: User): Promise<Response> {
        if (!Object.keys(user).length) {
            throw new Error('user is empty.');
        }
        const sessionId = cryptoKey(32);
        user.setSession(sessionId);
        const cookie = this.generateCookie(sessionId);
        const token = this.generateToken(sessionId, user);
        return { cookie, token, user };
    }

    public async renewTicket(cookie: string, sessionId: string, user: User): Promise<Response> {
        try {
            const token = this.generateToken(sessionId, user);
            return { token, cookie, user };
        } catch {
            throw new Error('Cookie has wrong format.');
        }
    }

    private generateToken(sessionId: string, user: User): string {
        const token = jwt.sign(
            { username: user.username, expiresIn: '10m', sessionId, userId: user.userId },
            Keys.privateKey(),
            {
                expiresIn: '10m'
            }
        );
        return token;
    }

    private generateCookie(sessionId: string): string {
        const cookie = jwt.sign({ sessionId }, Keys.privateCookieKey(), { expiresIn: '1d' });
        return cookie;
    }
}
