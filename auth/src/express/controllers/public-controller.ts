import { Response } from 'express';
import { Factory } from 'final-di';
import { TokenExpiredError } from 'jsonwebtoken';
import { Body, Cookie, OnGet, OnPost, Res, RestController } from 'rest-app';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { AuthService } from '../../api/services/auth-service';
import { Logger } from '../../api/services/logger';
import { AnonymousException } from '../../core/exceptions/anonymous-exception';
import { anonymous } from '../../core/models/anonymous';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';
import { makeSpan } from '../../util/otel';

@RestController({
    prefix: 'system/auth'
})
export class PublicController {
    @Factory(AuthService)
    private _authHandler: AuthHandler;

    @OnGet()
    public index(): AuthServiceResponse {
        return createResponse({}, 'Authentication service is available');
    }

    @OnPost()
    public async login(
        @Body('username') username: string,
        @Body('password') password: string,
        @Res() res: Response
    ): Promise<AuthServiceResponse> {
        Logger.debug(`user: ${username} -- signs in`);
        const ticket = await this._authHandler.login(username, password);
        res.setHeader(AuthHandler.AUTHENTICATION_HEADER, ticket.token.toString());
        res.cookie(AuthHandler.COOKIE_NAME, ticket.cookie.toString(), { secure: true, httpOnly: true });
        return createResponse();
    }

    @OnPost('who-am-i')
    public async whoAmI(
        @Cookie(AuthHandler.COOKIE_NAME) cookieAsString: string,
        @Res() res: Response
    ): Promise<AuthServiceResponse> {
        return makeSpan('who-am-i', async () => {
            try {
                const ticket = await this._authHandler.whoAmI(cookieAsString);
                res.setHeader(AuthHandler.AUTHENTICATION_HEADER, ticket.token.toString());
                return createResponse();
            } catch (e) {
                Logger.debug('Error while who-am-i');
                Logger.debug(e);
                res.clearCookie(AuthHandler.COOKIE_NAME);
                if (e instanceof AnonymousException) {
                    return createResponse(anonymous, 'anonymous');
                }
                if (e instanceof TokenExpiredError) {
                    return createResponse(anonymous, 'anonymous');
                }
                throw e;
            }
        });
    }
}
