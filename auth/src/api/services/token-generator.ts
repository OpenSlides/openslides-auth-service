import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { uuid } from 'uuidv4';

import Client from '../../core/models/client/client';
import ClientService from '../../core/models/client/client-service';
import { ClientServiceInterface } from '../../core/models/client/client-service.interface';
import { SECRET, SECRET_COOKIE } from '../../config';
import { Constructable, Inject } from '../../core/modules/decorators';
import { Cookie, Generator, Response } from '../interfaces/generator';

@Constructable(Generator)
export default class TokenGenerator implements Generator {
    public name = 'TokenGenerator';

    @Inject(ClientServiceInterface)
    private clientService: ClientService;

    public constructor() {
        this.init();
    }

    public async createTicket(username: string, password: string): Promise<Response> {
        const client = await this.clientService.getClientByCredentials(username, password);
        if (client) {
            const sessionId = uuid();
            const cookie = jwt.sign({ sessionId }, SECRET_COOKIE, { expiresIn: '1d' });
            console.log('client', client);
            client.setSession(sessionId);
            const token = this.generateToken(sessionId, client);
            return { cookie, token };
        } else {
            throw new Error('Client is not defined.');
        }
    }

    public async renewTicket(cookieAsString: string): Promise<Response> {
        try {
            const refreshId = this.verifyCookie(cookieAsString);
            console.log('refreshId', refreshId);
            const client = (await this.clientService.getClientBySessionId(refreshId.sessionId)) || ({} as Client);
            const token = this.generateToken(refreshId.sessionId, client);
            return { token, cookie: cookieAsString };
        } catch {
            throw new Error('Cookie has wrong format.');
        }
    }

    public verifyCookie(cookieAsString: string): Cookie {
        return jwt.verify(cookieAsString, SECRET_COOKIE) as Cookie;
    }

    private init(): void {
        this.insertMockData();
        cookieParser(SECRET_COOKIE);
    }

    private generateToken(sessionId: string, client: Client): string {
        const token = jwt.sign(
            { username: client.username, expiresIn: '10m', sessionId, clientId: client.clientId },
            SECRET,
            {
                expiresIn: '10m'
            }
        );
        return token;
    }

    private async insertMockData(): Promise<void> {
        if (this.clientService) {
            await this.clientService.create('admin', 'admin');
            await this.clientService.getClientByCredentials('admin', 'admin');
        }
    }
}
