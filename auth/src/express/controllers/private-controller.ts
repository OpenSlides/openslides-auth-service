import { Request, Response } from 'express';
import { Factory } from 'final-di';
import { Body, OnPost, Res, RestController, Req } from 'rest-app';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { AuthService } from '../../api/services/auth-service';
import { AuthorizationException } from '../../core/exceptions/authorization-exception';
import { Id } from '../../core/key-transforms';
import { JwtPayload } from '../../core/ticket/base-jwt';
import { Token } from '../../core/ticket/token';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';
import { TicketMiddleware } from '../middleware/ticket-validator';

@RestController({
    prefix: 'internal/auth'
})
export class PrivateController {
    @Factory(AuthService)
    private _authHandler: AuthHandler;

    @OnPost('authenticate', { middleware: [TicketMiddleware] })
    public authenticate(@Res() res: Response): AuthServiceResponse {
        const token = res.locals['token'] as Token;
        console.log('authenticate', token, createResponse({ userId: token.userId, sessionId: token.sessionId }));
        return createResponse({ userId: token.userId, sessionId: token.sessionId });
    }

    @OnPost()
    public async hash(@Body('toHash') toHash: string): Promise<AuthServiceResponse> {
        return createResponse({ hash: await this._authHandler.toHash(toHash) });
    }

    @OnPost('is-equals')
    public async isEquals(
        @Body('toHash') toHash: string,
        @Body('toCompare') toCompare: string
    ): Promise<AuthServiceResponse> {
        return createResponse({ isEquals: await this._authHandler.isEquals(toHash, toCompare) });
    }

    @OnPost('create-authorization-token')
    public createAuthorizationToken(@Body() body: JwtPayload, @Res() res: Response): AuthServiceResponse {
        res.setHeader(AuthHandler.AUTHORIZATION_HEADER, this._authHandler.createAuthorizationToken(body));
        return createResponse();
    }

    @OnPost('verify-authorization-token')
    public async verifyAuthorizationToken(@Req() req: Request): Promise<AuthServiceResponse> {
        const authorizationToken = req.get(AuthHandler.AUTHORIZATION_HEADER);
        if (authorizationToken) {
            return createResponse(await this._authHandler.verifyAuthorizationToken(authorizationToken));
        } else {
            throw new AuthorizationException('You are not authorized');
        }
    }

    @OnPost('clear-sessions-by-user-id')
    public async clearSessionsByUserId(@Body('userId') userId: Id): Promise<AuthServiceResponse> {
        await this._authHandler.clearAllSessions(userId);
        return createResponse();
    }
}
