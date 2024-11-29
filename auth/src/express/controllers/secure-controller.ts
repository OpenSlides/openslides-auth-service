import { Response } from 'express';
import { Factory } from 'final-di';
import { Body, OnGet, OnPost, Res, RestController } from 'rest-app';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { AuthService } from '../../api/services/auth-service';
import { Token } from '../../core/ticket/token';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';
import { makeSpan } from '../../util/otel';
import { TicketMiddleware } from '../middleware/ticket-validator';
import { Id } from '../../core/key-transforms';

@RestController({
    prefix: 'system/auth/secure',
    middleware: [TicketMiddleware]
})
export class SecureController {
    @Factory(AuthService)
    private _authHandler: AuthHandler;

    @OnGet()
    public index(): AuthServiceResponse {
        return createResponse({}, 'Yeah! A secure route!');
    }

    @OnPost()
    public async logout(@Res() res: Response): Promise<AuthServiceResponse> {
        const token = res.locals['token'] as Token;
        await this._authHandler.logout(token);
        res.clearCookie(AuthHandler.COOKIE_NAME);
        return createResponse();
    }

    @OnGet('list-sessions')
    public async listSessions(): Promise<{ sessions: string[] }> {
        return { sessions: await this._authHandler.getListOfSessions() };
    }

    @OnPost('clear-all-sessions-except-themselves')
    public async clearAllSessionsExceptThemselves(@Res() res: Response): Promise<AuthServiceResponse> {
        const token = res.locals['token'] as Token;
        await this._authHandler.clearAllSessionsExceptThemselves(token.sessionId);
        return createResponse();
    }

    @OnPost('clear-all-sessions')
    public async clearAllSessions(@Res() res: Response): Promise<AuthServiceResponse> {
        return makeSpan('clear-all-sessions', async () => {
            const token = res.locals['token'] as Token;
            await this._authHandler.clearAllSessions(token.userId);
            return createResponse();
        });
    }

    @OnPost('clear-sessions-by-user-id')
    public async clearSessionsByUserId(@Body('userId') userId: Id): Promise<AuthServiceResponse> {
        await this._authHandler.clearAllSessions(userId);
        return createResponse();
    }

    @OnPost('clear-session-by-id')
    public async clearSessionById(@Body('sessionId') sessionId: string): Promise<AuthServiceResponse> {
        await this._authHandler.clearUserSessionById(sessionId);
        return createResponse();
    }
}
