import express from 'express';

import { Constructable, Inject } from '../../util/di';
import { Cookie } from '../../core/ticket';
import { RouteHandler } from '../interfaces/route-handler';
import { AuthHandler } from '../interfaces/auth-handler';
import { AuthService } from '../services/auth-service';

@Constructable(RouteHandler)
export default class RouteService implements RouteHandler {
    public name = 'RouteHandler';

    @Inject(AuthHandler)
    private authHandler: AuthService;

    public async login(request: express.Request, response: express.Response): Promise<void> {
        const username = request.body.username;
        const password = request.body.password;

        try {
            const ticket = await this.authHandler.login(username, password);
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
        } catch (e) {
            response.status(400).json({
                success: false,
                message: e
            });
        }
    }

    public async whoAmI(request: express.Request, response: express.Response): Promise<void> {
        const cookieAsString = request.cookies['refreshId'];
        try {
            const ticket = await this.authHandler.whoAmI(cookieAsString);
            response.json({
                success: true,
                message: 'Authentication successful!',
                token: ticket.token
            });
        } catch (e) {
            response.json({
                success: false,
                message: e
            });
        }
    }

    public logout(request: any, response: express.Response): void {
        const cookie = request['cookie'] as Cookie;
        try {
            this.authHandler.logout(cookie);
            response.clearCookie('refreshId').send({
                success: true,
                message: 'Successfully signed out!'
            });
        } catch (e) {
            response.json({
                success: false,
                message: e
            });
        }
    }

    public getListOfSessions(request: express.Request, response: express.Response): void {
        response.status(200).json({
            success: true,
            message: this.authHandler.getListOfSessions()
        });
    }

    public clearSessionById(request: any, response: express.Response): void {
        const cookie = request['cookie'] as Cookie;
        try {
            this.authHandler.clearSessionById(cookie);
            response.json({
                success: true,
                message: 'Cleared!'
            });
        } catch (e) {
            response.json({
                success: false,
                message: e
            });
        }
    }

    public clearAllSessionsExceptThemselves(request: any, response: express.Response): void {
        const cookie = request['cookie'] as Cookie;
        try {
            this.authHandler.clearAllSessionsExceptThemselves(cookie);
            response.json({
                success: true,
                message: 'Cleared!'
            });
        } catch (e) {
            response.json({
                success: false,
                message: 'You have no permission!'
            });
        }
    }

    public hash(request: express.Request, response: express.Response): void {
        const toHash = request.body['toHash'];
        response.json({
            success: true,
            message: this.authHandler.toHash(toHash)
        });
    }

    public async notFound(request: express.Request, response: express.Response): Promise<void> {
        response.status(404).json({
            success: false,
            message: 'Your requested resource is not found...'
        });
    }

    /**
     * @deprecated
     * @param _
     * @param response
     */
    public index(_: any, response: express.Response): void {
        console.log('request');
        response.json({
            success: true,
            message: 'Hello World'
        });
    }

    /**
     * @deprecated
     * @param _
     * @param response
     */
    public secureIndex(_: any, response: express.Response): void {
        response.json({
            success: true,
            secure: true,
            message: 'Yeah! A secured page'
        });
    }
}
