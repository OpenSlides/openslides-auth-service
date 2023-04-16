import { Request, Response } from 'express';
import { Factory } from 'final-di';
import { OnGet, OnPost, Req, Res, RestController } from 'rest-app';

import { AxiosResponse } from 'axios';
import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { AuthHandler } from '../../api/interfaces/auth-handler';
import { Datastore } from '../../api/interfaces/datastore';
import { HttpHandler } from '../../api/interfaces/http-handler';
import { AuthService } from '../../api/services/auth-service';
import { HttpService } from '../../api/services/http-service';
import { Logger } from '../../api/services/logger';
import { Config } from '../../config';
import { User } from '../../core/models/user';
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

        // username attribute from SAML IDP
        const { username } = extract.attributes;

        const checkUser = await this._datastore.exists<User>('user', 'username', username);

        if (checkUser.exists) {
            // update known user
            await this.updateUser(extract.attributes);
        } else {
            // create new user
            await this.provisionUser(extract.attributes);
        }

        const ticket = await this._authHandler.doSamlLogin(username);

        Logger.debug(`user: ${username} -- signs in via SAML`);

        res.setHeader(AuthHandler.AUTHENTICATION_HEADER, ticket.token.toString());
        res.cookie(AuthHandler.COOKIE_NAME, ticket.cookie.toString(), { secure: true, httpOnly: true });

        // Todo: Better way for redirect to frontend?
        res.redirect('/');
    }

    /**
     * Creates a new OpenSlides user in the DB via backend action 'user.create_saml_account'.
     * 
     * @param attributes raw attributes send by SAML IDP
     */
    private async provisionUser(attributes: any): Promise<boolean> {
        const newUser = this.extractUserAttributes(attributes);
        Logger.debug('SAML: Creating new user: ' + newUser.saml_id);

        return this.makeBackendCall({
            action: 'user.create_saml_account',
            data: [newUser]
        });
    }

    /**
     * Updates an existing OpenSlides user in the DB via backend action 'user.update_saml_account'.
     * @param attributes raw attributes send by SAML IDP
     */
    private async updateUser(attributes: any): Promise<boolean> {
        const userAttributes = this.extractUserAttributes(attributes);
        Logger.debug('SAML: Updating user: ' + userAttributes.saml_id);

        return this.makeBackendCall({
            action: 'user.update_saml_account',
            data: [userAttributes]
        })
    }

    private async makeBackendCall(requestData: SamlBackendCall): Promise<boolean> {
        const url = Config.ACTION_URL + '/system/action/handle_request';
        const response: AxiosResponse = await this._httpHandler.post(url, [requestData]);

        if (response.status !== 200) {
            Logger.error('SAML: Failed calling backend action ' + requestData.action);
            return Promise.resolve(false);
        }

        return Promise.resolve(true);
    }

    private extractUserAttributes(attributes: any): SamlUser {
        const user: SamlUser = {
            saml_id: attributes.username,
            first_name: attributes.first_name,
            last_name: attributes.last_name,
        };

        if (this.stringPropertyExists(attributes, 'title')) user.title = attributes.title;
        if (this.stringPropertyExists(attributes, 'email')) user.email = attributes.email;

        if (this.stringPropertyExists(attributes, 'gender')) user.gender = attributes.gender;
        if (this.stringPropertyExists(attributes, 'pronoun')) user.pronoun = attributes.pronoun;
        if (attributes.is_active) user.is_active = (attributes.is_active === 'true' || attributes.is_active === 1) ? true : false;
        if (attributes.is_physical_person) user.is_physical_person = (attributes.is_physical_person === 'true' || attributes.is_physical_person === 1) ? true : false;

        return user;
    }

    /**
     * If an attribute is not set by the SAML IDP bit declared in the IDP mapper, we receive an object as value of the property.
     * @param obj raw attributes send by SAML IDP
     * @param property property to check
     * @returns 
     */
    private stringPropertyExists(obj: any, property: string): boolean {
        return obj.hasOwnProperty(property) && typeof obj[property] === 'string';
    }

}
