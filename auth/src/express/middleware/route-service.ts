import express, { Request, Response } from 'express';
import { JsonWebTokenError } from 'jsonwebtoken';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { AuthService } from '../../api/services/auth-service';
import { Inject } from '../../util/di';
import { Logger } from '../../api/services/logger';
import { HttpData, RouteHandler } from '../../api/interfaces/route-handler';
import { Token } from '../../core/ticket';

export default class RouteService extends RouteHandler {
    public name = 'RouteHandler';

    @Inject(AuthService)
    private authHandler: AuthHandler;

    public async login(request: express.Request, response: express.Response): Promise<void> {
        const username = request.body.username;
        const password = request.body.password;
        Logger.log(`user: ${username} -- signs in`);

        const result = await this.authHandler.login(username, password);
        if (!result.result) {
            this.sendResponse(false, result.message, response, 403);
            return;
        }

        response.locals['newToken'] = result.result.token;
        response.locals['newCookie'] = result.result.cookie;
        this.sendResponse(true, 'Authentication successful!', response);
    }

    public async whoAmI(request: express.Request, response: express.Response): Promise<void> {
        const cookieAsString = request.cookies[AuthHandler.COOKIE_NAME];
        const result = await this.authHandler.whoAmI(cookieAsString);
        if (!result.isValid) {
            response.clearCookie(AuthHandler.COOKIE_NAME);
            this.sendResponse(false, result.message, response, 403);
            return;
        }
        if (result.isValid && !result.result) {
            this.sendResponse(true, 'anonymous', response);
            return;
        }
        response.locals['newToken'] = result.result?.token;
        this.sendResponse(true, 'Authentication successful!', response);
    }

    public logout(request: express.Request, response: express.Response): void {
        const token = response.locals['token'] as Token;
        try {
            this.authHandler.logout(token);
            response.clearCookie(AuthHandler.COOKIE_NAME);
            this.sendResponse(true, 'Successfully signed out!', response);
        } catch (e) {
            this.sendResponse(false, e, response, 403);
        }
    }

    public async getListOfSessions(request: express.Request, response: express.Response): Promise<void> {
        this.sendResponse(true, 'Successful', response, 200, { sessions: await this.authHandler.getListOfSessions() });
    }

    public clearUserSessionByUserId(request: express.Request, response: express.Response): void {
        const userId = request.body['userId'];
        try {
            this.authHandler.clearUserSessionByUserId(userId);
            this.sendResponse(true, 'Cleared!', response);
        } catch (e) {
            this.sendResponse(false, e, response, 403);
        }
    }

    public clearAllSessionsExceptThemselves(request: express.Request, response: express.Response): void {
        const token = response.locals['token'] as Token;
        try {
            this.authHandler.clearAllSessionsExceptThemselves(token.userId);
            this.sendResponse(true, 'Cleared!', response);
        } catch (e) {
            this.sendResponse(false, e, response, 403);
        }
    }

    public hash(request: express.Request, response: express.Response): void {
        const toHash = request.body['toHash'];
        this.sendResponse(true, this.authHandler.toHash(toHash), response);
    }

    public async notFound(request: Request, response: Response): Promise<void> {
        this.sendResponse(false, 'Your requested resource is not found...', response, 404);
    }

    public index(_: any, response: Response): void {
        this.sendResponse(true, 'Authentication service is available', response);
    }

    public apiIndex(_: any, response: Response): void {
        this.sendResponse(true, 'Yeah! An api resource!', response);
    }

    public authenticate(_: any, response: Response): void {
        const token = response.locals['token'] as Token;
        this.sendResponse(true, 'Successful', response, 200, { userId: token.userId, sessionId: token.sessionId });
    }

    private sendResponse(
        success: boolean,
        message: string,
        response: Response,
        code: number = 200,
        data: HttpData = {}
    ): void {
        if (response.locals['newToken']) {
            response.setHeader('Authentication', response.locals['newToken']);
            response.setHeader('Access-Control-Expose-Headers', 'authentication, Authentication');
        }
        if (response.locals['newCookie']) {
            response.cookie(AuthHandler.COOKIE_NAME, response.locals['newCookie'], {
                secure: false,
                httpOnly: true
            });
        }
        Logger.log(`Successful: ${success} --- Message: ${message}`);
        response.status(code).send({
            success,
            message,
            ...data
        });
    }
}
