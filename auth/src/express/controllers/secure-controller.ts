import { Response } from 'express';
import { Factory } from 'final-di';
import { Body, OnGet, OnPost, Res, RestController } from 'rest-app';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { SamlHandler } from '../../api/interfaces/saml-handler';
import { UserHandler } from '../../api/interfaces/user-handler';
import { AuthService } from '../../api/services/auth-service';
import { Logger } from '../../api/services/logger';
import { SamlService } from '../../api/services/saml-service';
import { UserService } from '../../api/services/user-service';
import { Token } from '../../core/ticket/token';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';
import { makeSpan } from '../../util/otel';
import { TicketMiddleware } from '../middleware/ticket-validator';

@RestController({
    prefix: 'system/auth/secure',
    middleware: [TicketMiddleware]
})
export class SecureController {
    @Factory(AuthService)
    private _authHandler: AuthHandler;

    @Factory(SamlService)
    private _samlHandler: SamlHandler;

    @Factory(UserService)
    private _userHandler: UserHandler;

    @OnGet()
    public index(): AuthServiceResponse {
        return createResponse({}, 'Yeah! A secure route!');
    }

    @OnPost()
    public async logout(@Res() res: Response): Promise<AuthServiceResponse> {
        const token = res.locals['token'] as Token;
        await this._authHandler.logout(token);
        res.clearCookie(AuthHandler.COOKIE_NAME);

        const user = await this._userHandler.getUserByUserId(token.userId);
        const settings = await this._samlHandler.getSamlSettings();

        if (settings.saml_enabled && user.saml_id) {
            const sp = await this._samlHandler.getSp();
            const idp = await this._samlHandler.getIdp();

            Logger.log('sp: ', sp);
            Logger.log('idp: ', idp);
            const request = sp.createLogoutRequest(idp, 'redirect', {
                sessionIndex: token.sessionId,
                logoutNameID: user.saml_id
            });
            return createResponse({}, request.context);
        }
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

    @OnPost('clear-session-by-id')
    public async clearSessionById(@Body('sessionId') sessionId: string): Promise<AuthServiceResponse> {
        await this._authHandler.clearUserSessionById(sessionId);
        return createResponse();
    }
}
