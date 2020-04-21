import express from 'express';

import ClientService from '../../core/models/client/client-service';
import { ClientServiceInterface } from '../../core/models/client/client-service.interface';
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

    public async login(request: express.Request, response: express.Response): Promise<void> {
        const username = request.body.username;
        const password = request.body.password;

        if (!username || !password) {
            response.status(403).json({
                success: false,
                message: 'Authentication failed! Please check the request'
            });
            return;
        }

        if (this.clientService.hasClient(username, password)) {
            const ticket = await this.tokenGenerator.createTicket(username, password);
            response
                .cookie('refreshId', ticket.cookie, {
                    maxAge: 7200000,
                    httpOnly: true,
                    secure: false
                })
                .send({
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
    }

    public async whoAmI(request: express.Request, response: express.Response): Promise<void> {
        const cookie = request.cookies['refreshId'];
        const ticket = await this.tokenGenerator.renewTicket(cookie);
        response.json({
            success: true,
            message: 'Authentication successful!',
            token: ticket.token
        });
    }

    public logout(request: express.Request, response: express.Response): void {
        const cookie = request.cookies['refreshId'];
        if (this.tokenGenerator.verifyCookie(cookie)) {
            response.clearCookie('refreshId').send({
                success: true,
                message: 'Successfully signed out!'
            });
        } else {
            response.status(403).json({
                success: false,
                message: 'Credentials are invalid!'
            });
        }
    }

    public async notFound(request: express.Request, response: express.Response): Promise<void> {
        response.status(404).json({
            success: false,
            message: 'Your requested resource is not found...'
        });
    }

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
