import express from 'express';

import ClientService from '../../core/models/client/client-service';
import { ClientServiceInterface } from '../../core/models/client/client-service.interface';
import { Constructable, Inject, InjectService } from '../../core/modules/decorators';
import { Cookie, Generator } from '../interfaces/generator';
import { RouteHandlerInterface } from '../interfaces/route-handler-interface';
import SessionHandler from './session-handler';
import TokenGenerator from './token-generator';

@Constructable(RouteHandlerInterface)
export default class RouteHandler implements RouteHandlerInterface {
    public name = 'RouteHandler';

    @Inject(ClientServiceInterface)
    private clientService: ClientService;

    @Inject(Generator)
    private tokenGenerator: TokenGenerator;

    @InjectService(SessionHandler)
    private sessionHandler: SessionHandler;

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
            this.sessionHandler.addSession(ticket.client);
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
        console.log('cookie', cookie);
        try {
            const ticket = await this.tokenGenerator.renewTicket(cookie);
            response.json({
                success: true,
                message: 'Authentication successful!',
                token: ticket.token
            });
        } catch {
            response.json({
                success: false,
                message: 'Cookie is wrong!'
            });
        }
    }

    public logout(request: any, response: express.Response): void {
        const cookie = request['cookie'] as Cookie;
        if (cookie) {
            this.sessionHandler.clearSessionById(cookie.sessionId);
            response.clearCookie('refreshId').send({
                success: true,
                message: 'Successfully signed out!'
            });
        } else {
            response.json({
                success: false,
                message: 'Credentials are invalid!'
            });
        }
    }

    public getListOfSessions(request: express.Request, response: express.Response): void {
        response.status(200).json({
            success: true,
            message: this.sessionHandler.getAllActiveSessions()
        });
    }

    public clearSessionById(request: any, response: express.Response): void {
        const cookie = request['cookie'] as Cookie;
        const answer = this.sessionHandler.clearSessionById(cookie.sessionId);
        if (answer) {
            response.json({
                success: true,
                message: 'Cleared!'
            });
        } else {
            response.json({
                success: false,
                message: 'You have no permission!'
            });
        }
    }

    public clearAllSessionsExceptThemselves(request: any, response: express.Response): void {
        const cookie = request['cookie'] as Cookie;
        const answer = this.sessionHandler.clearAllSessionsExceptThemselves(cookie.sessionId);
        if (answer) {
            response.json({
                success: true,
                message: 'Cleared!'
            });
        } else {
            response.json({
                success: false,
                message: 'You have no permission!'
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
