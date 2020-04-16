import express from 'express';

import ClientService from '../../model-services/client-service';
import { ClientServiceInterface } from '../../model-services/client-service.interface';
import { Constructable, Inject } from '../../core/modules/decorators';
import { Generator } from '../interfaces/generator';
import { RouteHandlerInterface } from '../interfaces/route-handler-interface';
import TokenGenerator from './token-generator';

@Constructable(RouteHandlerInterface)
export default class RouteHandler implements RouteHandlerInterface {
    public name = 'RouteHandler';

    @Inject(ClientServiceInterface)
    private clientService: ClientService;
    @Inject(Generator)
    private tokenGenerator: TokenGenerator;

    public constructor() {}

    public async login(request: express.Request, response: express.Response): Promise<void> {
        const username = request.body.username;
        const password = request.body.password;

        // const mockedUsername = 'admin';
        // const mockedPassword = 'admin';

        if (!username || !password) {
            response.status(403).json({
                success: false,
                message: 'Authentication failed! Please check the request'
            });
            return;
        }

        if (this.clientService.hasClient(username, password)) {
            const ticket = await this.tokenGenerator.createTicket(username, password);
            response.cookie('refreshId', ticket.cookie, { httpOnly: true, secure: false });
            response.json({
                success: true,
                message: 'Authentication successful!',
                token: ticket.token
            });
        } else {
            response.status(403).json({
                success: false,
                message: 'Incorrect username or password'
            });
        }
        // if (username === mockedUsername && password === mockedPassword) {
        //     const refreshId = uuid();
        //     const clientId = uuid();
        //     const token = jwt.sign({ username, expiresIn: '10m', refreshId, clientId }, SECRET, {
        //         expiresIn: '10m'
        //     });

        //     cookieParser(SECRET_COOKIE);
        //     response.cookie('refreshId', refreshId, { httpOnly: true, secure: false });
        //     response.json({
        //         success: true,
        //         message: 'Authentication successful!',
        //         token,
        //         refreshId
        //     });
        // } else {
        //     response.status(403).json({
        //         success: false,
        //         message: 'Incorrect username or password'
        //     });
        // }
    }

    // public refreshToken(request: express.Request, reponse: express.Response): void {
    //     const refreshToken = request.cookies['sessionId'];
    //     // const username = request.body.username;
    //     // const token = jwt.sign({username}, secret, {expiresIn: '1h'})
    // }

    public async whoAmI(request: express.Request, response: express.Response): Promise<void> {
        const cookie = request.cookies('refreshId');
        console.log('cookie', cookie);
        const ticket = await this.tokenGenerator.renewTicket(cookie);
        response.json({
            success: true,
            message: 'Authentication successful!',
            token: ticket.token
        });
    }

    public logout(request: express.Request, response: express.Response): void {}

    public async notFound(request: express.Request, response: express.Response): Promise<void> {}

    public index(_: any, response: express.Response): void {
        response.json({
            success: true,
            message: 'Hello World'
        });
    }

    public secureIndex(_: any, response: express.Response): void {
        response.json({
            success: true,
            secure: true,
            message: 'Yeah! A secured page'
        });
    }
}
