import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { uuid } from 'uuidv4';

import Client from '../../core/models/client';
import ClientService from '../../model-services/client-service';
import { ClientServiceInterface } from '../../model-services/client-service.interface';
import { SECRET, SECRET_COOKIE } from '../../config';
import { Constructable, Inject } from '../../core/modules/decorators';
import { Cookie, Generator, Response } from '../interfaces/generator';

@Constructable(Generator)
export default class TokenGenerator implements Generator {
    public name = 'TokenGenerator';

    @Inject(ClientServiceInterface)
    private clientService: ClientService;

    public constructor() {
        // this.insertMockData();
        this.init();
    }

    public async createTicket(username: string, password: string): Promise<Response> {
        const client = await this.clientService.getClientByCredentials(username, password);
        if (client) {
            const sessionId = uuid();
            // const token = jwt.sign({ username, expiresIn: '10m', sessionId, clientId: client.clientId }, SECRET, {
            //     expiresIn: '10m'
            // });
            const cookie = jwt.sign({ sessionId }, SECRET_COOKIE, { expiresIn: '1d' });
            // cookieParser(SECRET_COOKIE);
            client.setSession(sessionId);
            const token = this.generateToken(sessionId, client);
            return { cookie, token };
        } else {
            throw new Error('Client is not defined.');
        }
    }

    public async renewTicket(cookieAsString: string): Promise<Response> {
        try {
            const refreshId = jwt.verify(cookieAsString, SECRET) as Cookie;
            console.log('refreshId', refreshId);
            const client = await this.clientService.getClientBySessionId(refreshId.sessionId);
            const token = this.generateToken(refreshId.sessionId, client);
            return { token, cookie: cookieAsString };
        } catch {
            throw new Error('Cookie has wrong format.');
        }
    }

    // public async login(request: express.Request, response: express.Response): Promise<void> {
    //     const username = request.body.username;
    //     const password = request.body.password;

    //     const mockedUsername = 'admin';
    //     const mockedPassword = 'admin';

    //     if (!username || !password) {
    //         response.json({
    //             success: false,
    //             message: 'Authentication failed! Please check the request'
    //         });
    //         return;
    //     }
    //     if (username === mockedUsername && password === mockedPassword) {
    //         const refreshId = uuid();
    //         const clientId = uuid();
    //         const token = jwt.sign({ username, expiresIn: '10m', refreshId, clientId }, SECRET, {
    //             expiresIn: '10m'
    //         });

    //         cookieParser(SECRET_COOKIE);
    //         response.cookie('refreshId', refreshId, { httpOnly: true, secure: false });
    //         response.json({
    //             success: true,
    //             message: 'Authentication successful!',
    //             token,
    //             refreshId
    //         });
    //     } else {
    //         response.status(403).json({
    //             success: false,
    //             message: 'Incorrect username or password'
    //         });
    //     }
    // }

    // public refreshToken(request: express.Request, reponse: express.Response): void {
    //     const refreshToken = request.cookies['sessionId'];
    //     // const username = request.body.username;
    //     // const token = jwt.sign({username}, secret, {expiresIn: '1h'})
    // }

    // public index(_: any, response: express.Response): void {
    //     response.json({
    //         success: true,
    //         message: 'Hello World'
    //     });
    // }

    // public secureIndex(_: any, response: express.Response): void {
    //     response.json({
    //         success: true,
    //         message: 'Yeah! A secured page'
    //     });
    // }

    private init(): void {
        this.insertMockData();
        cookieParser(SECRET_COOKIE);
    }

    private generateToken(sessionId: string, client: Client): string {
        // const sessionId = uuid();
        const token = jwt.sign(
            { username: client.username, expiresIn: '10m', sessionId, clientId: client.clientId },
            SECRET,
            {
                expiresIn: '10m'
            }
        );
        // const cookie = jwt.sign({ sessionId }, SECRET_COOKIE, { expiresIn: '1d' });
        // client.setSession(sessionId);
        // return { token, cookie };
        return token;
    }

    private insertMockData(): void {
        if (this.clientService) {
            this.clientService.create('admin', 'admin');
        }
    }
}
