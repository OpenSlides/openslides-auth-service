import { Request, Response } from 'express';
import { Factory } from 'final-di';
import { OnGet, OnPost, Req, Res, RestController } from 'rest-app';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { SamlHandler, SamlAttributes } from '../../api/interfaces/saml-handler';
import { UserHandler } from '../../api/interfaces/user-handler';
import { AuthService } from '../../api/services/auth-service';
import { Logger } from '../../api/services/logger';
import { SamlService } from '../../api/services/saml-service';
import { UserService } from '../../api/services/user-service';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

/* eslint-enable */

@RestController({
    prefix: 'system/saml'
})
export class SamlController {
    @Factory(UserService)
    private _userHandler: UserHandler;

    @Factory(AuthService)
    private _authHandler: AuthHandler;

    @Factory(SamlService)
    private readonly _samlHandler: SamlHandler;

    /**
     * Indicates if the service is available
     *
     * @returns Generic response
     */
    @OnGet()
    public async index(): Promise<AuthServiceResponse> {
        if (!(await this._samlHandler.getSamlSettings()).saml_enabled) {
            return createResponse({}, 'SAML SP service is disabled');
        }
        return createResponse({}, 'SAML SP service is available');
    }

    /**
     * Loads the metadata of the SAML service provider
     *
     * @param res Response
     */
    @OnGet()
    public async metadata(@Res() res: Response): Promise<void> {
        if (!(await this._samlHandler.getSamlSettings()).saml_enabled) {
            res.status(404).send('SAML SP service is disabled');
        }
        res.header('Content-Type', 'text/xml').send((await this._samlHandler.getSamlSettings()).saml_metadata_sp);
    }

    @OnPost()
    public async idplogout(@Req() req: Request, @Res() res: Response): Promise<void> {
        const sp = await this._samlHandler.getSp();
        const idp = await this._samlHandler.getIdp();

        const extract = await idp.parseLogoutRequest(sp, 'post', req);
        const user = await this._userHandler.getUserBySamlId(
            extract?.extract.nameID // eslint-disable-line @typescript-eslint/no-unsafe-member-access
        );
        await this._authHandler.clearAllSessions(user.id);

        const response = sp.createLogoutResponse(idp, req, 'redirect');
        res.redirect(response.context);
    }

    @OnGet()
    public logout(@Req() req: Request, @Res() res: Response): void {
        // This is the callback route for the SAML logout request.
        // Simply redirect to the root since logout already happened.
        res.redirect('/');
    }

    /**
     * Generates the SAML login url for client redirection.
     *
     * @returns SAML Login Url
     */
    @OnGet()
    public async getUrl(): Promise<AuthServiceResponse> {
        if (!(await this._samlHandler.getSamlSettings()).saml_enabled) {
            return createResponse({}, 'SAML SP service is disabled');
        }
        const sp = await this._samlHandler.getSp();
        const idp = await this._samlHandler.getIdp();
        const request = sp.createLoginRequest(idp, 'redirect');
        return createResponse({}, request.context);
    }

    /**
     * SAML SP: Receives the SAML response from the SAML IDP, handels authentication and redirects to the frontend.
     *
     * @param req Request
     * @param res Response
     * @returns
     */
    @OnPost()
    public async acs(@Req() req: Request, @Res() res: Response): Promise<void> {
        if (!(await this._samlHandler.getSamlSettings()).saml_enabled) {
            res.status(404).send('SAML SP service is disabled');
        }
        const sp = await this._samlHandler.getSp();
        const idp = await this._samlHandler.getIdp();

        const {
            extract // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        }: {
            extract: { attributes: SamlAttributes };
        } = await sp.parseLoginResponse(idp, 'post', req);
        const { username }: { username: string } = extract.attributes;

        const userId = await this._samlHandler.provisionUser(extract.attributes);

        const samlAttributeMapping = (await this._samlHandler.getSamlSettings()).saml_attr_mapping;
        const user = await this._userHandler.getUserByUserId(userId);
        // userId -1 means that the backend call by provisionUser was bad
        // fe. malformed is_active and should result in the exception thrown by doSamlLogin
        if (userId !== -1 && !user.is_active) {
            res.set('Content-Type', 'text/html');
            let fileContent = fs.readFileSync(path.join(__dirname, 'not_is_active.html'), 'utf8');
            if (user.username.includes('mouse')) {
                fileContent = util.format(fileContent, fs.readFileSync(path.join(__dirname, 'guardian.txt')));
            } else {
                fileContent = util.format(fileContent, '');
            }
            if ('is_active' in samlAttributeMapping) {
                res.send(util.format(fileContent, '', ''));
            } else {
                res.send(
                    util.format(
                        fileContent,
                        ' and the activity status is not being mapped by the SAML data',
                        ' und der Aktivitätsstatus wird nicht aus den SAML Daten übernommen'
                    )
                );
            }
        } else {
            const ticket = await this._authHandler.doSamlLogin(userId);

            Logger.debug(`user: ${username} -- signs in via SAML`);

            res.setHeader(AuthHandler.AUTHENTICATION_HEADER, ticket.token.toString());
            res.cookie(AuthHandler.COOKIE_NAME, ticket.cookie.toString(), { secure: true, httpOnly: true });

            // Todo: Better way for redirect to frontend?
            res.redirect('/');
        }
    }
}
