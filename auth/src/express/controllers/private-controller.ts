import { Response } from 'express';
import { Factory } from 'final-di';
import { Body, OnPost, Res, RestController } from 'rest-app';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { AuthService } from '../../api/services/auth-service';
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
    public hash(@Body('toHash') toHash: string): AuthServiceResponse {
        return createResponse({ hash: this._authHandler.toHash(toHash) });
    }

    @OnPost('is-equals')
    public isEquals(@Body('toHash') toHash: string, @Body('toCompare') toCompare: string): AuthServiceResponse {
        return createResponse({ isEquals: this._authHandler.isEquals(toHash, toCompare) });
    }
}
