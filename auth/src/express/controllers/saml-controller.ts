import { Request, Response } from 'express';
import { Factory } from 'final-di';
import { OnGet, OnPost, Req, Res, RestController } from 'rest-app';

import { AxiosResponse } from 'axios';
import { AuthenticationException } from 'src/core/exceptions/authentication-exception';
import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { AuthHandler } from '../../api/interfaces/auth-handler';
import { Datastore } from '../../api/interfaces/datastore';
import { HttpHandler } from '../../api/interfaces/http-handler';
import { AuthService } from '../../api/services/auth-service';
import { HttpService } from '../../api/services/http-service';
import { Logger } from '../../api/services/logger';
import { Config } from '../../config';
import saml from '../../saml';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';

export interface SamlUser {
    saml_id: string, title?: string, first_name: string, last_name: string, email?: string, gender?: string, pronoun?: string, is_active?: boolean, is_physical_person?: boolean | string
}

interface SamlBackendCall {
    action: string, data: [SamlUser]
}

@RestController({
    prefix: 'system/saml'
})
export class SamlController {
    @Factory(AuthService)
    private _authHandler: AuthHandler;

    @Factory(DatastoreAdapter)
    private readonly _datastore: Datastore;

    @Factory(HttpService)
    private readonly _httpHandler: HttpHandler;

    /**
     * Indicates if the service is available
     * @returns Generic response
     */
    @OnGet()
    public index(): AuthServiceResponse {
        return createResponse({}, 'SAML SP service is available');
    }

    /**
     * Loads the metadata of the SAML service provider
     * @param res Response
     */
    @OnGet()
    public metadata(@Res() res: Response) {
        res.header('Content-Type', 'text/xml').send(saml.sp.getMetadata());
    }

    /**
     * SAML SP: Initiates the login process and redirects to the SAML IDP.
     * @param res Response
     * @returns Redirect to SAML IDP
     */
    @OnGet()
    public send(@Res() res: Response): void {
        const { id, context } = saml.sp.createLoginRequest(saml.idp, 'redirect');
        return res.redirect(context);
    }

    /**
     * Generates the SAML login url for client redirection.
     * @param res Response
     * @returns SAML Login Url
     */
    @OnGet()
    public getUrl(@Res() res: Response): AuthServiceResponse {
        const { id, context } = saml.sp.createLoginRequest(saml.idp, 'redirect');
        return createResponse({}, context);
    }

    /**
     * SAML SP: Receives the SAML response from the SAML IDP, handels authentication and redirects to the frontend.
     * @param req Request
     * @param res Response
     * @returns 
     */
    @OnPost()
    public async acs(@Req() req: Request, @Res() res: Response) {
        console.debug('SAML: ACS')

        const { extract } = await saml.sp.parseLoginResponse(saml.idp, 'post', req);
        const { username } = extract.attributes;

        Logger.debug('SAML: creating or updating user: ' + username);

        const backendStatus = await this.makeBackendCall({
            action: 'user.save_saml_account',
            data: [extract.attributes]
        });

        if (!backendStatus) {
            throw new AuthenticationException('SAML: Failed creating or updating user: ' + username);
        }

        // ToDo: doSamlLogin with user_id
        const ticket = await this._authHandler.doSamlLogin(username);

        Logger.debug(`user: ${username} -- signs in via SAML`);

        res.setHeader(AuthHandler.AUTHENTICATION_HEADER, ticket.token.toString());
        res.cookie(AuthHandler.COOKIE_NAME, ticket.cookie.toString(), { secure: true, httpOnly: true });

        // Todo: Better way for redirect to frontend?
        res.redirect('/');
    }

    /**
     * Creates or updates an OpenSlides user in the DB via backend action 'user.save_saml_account'.
     * The user_id is returned.
     * 
     * @param attributes raw (user) attributes send by the SAML IDP
     */
    private async makeBackendCall(requestData: SamlBackendCall): Promise<boolean> {
        const url = Config.ACTION_URL + '/system/action/handle_request';
        const response: AxiosResponse = await this._httpHandler.post(url, [requestData]);

        if (response.status !== 200) {
            Logger.error('SAML: Failed calling backend action ' + requestData.action);
            return false;
        }
        // ToDo: extract the user_id from the response

        return true;
    }
}
