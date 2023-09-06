import { Request, Response } from 'express';
import { Factory } from 'final-di';
import { OnGet, OnPost, Req, Res, RestController } from 'rest-app';
import * as samlify from 'samlify';

import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { AuthHandler } from '../../api/interfaces/auth-handler';
import { Datastore } from '../../api/interfaces/datastore';
import { HttpHandler, HttpResponse } from '../../api/interfaces/http-handler';
import { SecretHandler } from '../../api/interfaces/secret-handler';
import { AuthService } from '../../api/services/auth-service';
import { HttpService } from '../../api/services/http-service';
import { Logger } from '../../api/services/logger';
import { SecretService } from '../../api/services/secret-service';
import { Config } from '../../config';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';

const INTERNAL_AUTHORIZATION_HEADER = 'Authorization';

/* eslint-disable @typescript-eslint/naming-convention */
export interface SamlUser {
    saml_id: string;
    title?: string;
    first_name: string;
    last_name: string;
    email?: string;
    gender?: string;
    pronoun?: string;
    is_active?: boolean;
    is_physical_person?: boolean | string;
}

export interface SamlSettings {
    saml_enabled: string;
    saml_metadata_idp: string;
    saml_metadata_sp: string;
    saml_private_key: string;
}

interface SamlBackendCall {
    action: string;
    data: [SamlUser];
}

interface SamlAttributes extends SamlUser {
    username: string;
}

interface SamlHttpResponse {
    results: { user_id: number }[][];
}
/* eslint-enable */

@RestController({
    prefix: 'system/saml'
})
export class SamlController {
    @Factory(AuthService)
    private _authHandler: AuthHandler;

    @Factory(HttpService)
    private readonly _httpHandler: HttpHandler;

    @Factory(DatastoreAdapter)
    private readonly _datastore: Datastore;

    @Factory(SecretService)
    private readonly _secretHandler: SecretHandler;

    private _samlSettings: SamlSettings;

    /**
     * Indicates if the service is available
     *
     * @returns Generic response
     */
    @OnGet()
    public index(): AuthServiceResponse {
        return createResponse({}, 'SAML SP service is available');
    }

    /**
     * Loads the metadata of the SAML service provider
     *
     * @param res Response
     */
    @OnGet()
    public async metadata(@Res() res: Response): Promise<void> {
        res.header('Content-Type', 'text/xml').send((await this.getSamlSettings()).saml_metadata_sp);
    }

    /**
     * SAML SP: Initiates the login process and redirects to the SAML IDP.
     *
     * @param res Response
     * @returns Redirect to SAML IDP
     */
    @OnGet()
    public async send(@Res() res: Response): Promise<void> {
        const request = (await this.getSp()).createLoginRequest(await this.getIdp(), 'redirect');
        return res.redirect(request.context);
    }

    /**
     * Generates the SAML login url for client redirection.
     *
     * @returns SAML Login Url
     */
    @OnGet()
    public async getUrl(): Promise<AuthServiceResponse> {
        const sp = await this.getSp();
        const idp = await this.getIdp();
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
        console.debug('SAML: ACS');
        const sp = await this.getSp();
        const idp = await this.getIdp();

        const {
            extract // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        }: {
            extract: { attributes: SamlAttributes };
        } = await sp.parseLoginResponse(idp, 'post', req);
        const { username }: { username: string } = extract.attributes;

        const userId = await this.provisionUser(extract.attributes);

        const ticket = await this._authHandler.doSamlLogin(userId);

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
    private async provisionUser(attributes: SamlAttributes): Promise<number> {
        Logger.debug('SAML: Creating new user: ' + attributes.username);

        return this.makeBackendCall({
            action: 'user.save_saml_account',
            data: [attributes]
        });
    }

    private async makeBackendCall(requestData: SamlBackendCall): Promise<number> {
        const url = Config.ACTION_URL + '/internal/handle_request';
        const response: HttpResponse<SamlHttpResponse> = (await this._httpHandler.post(url, [requestData], {
            [INTERNAL_AUTHORIZATION_HEADER]: this._secretHandler.getInternalAuthPassword()
        })) as HttpResponse<SamlHttpResponse>;

        if (response.status !== 200 || !response.results) {
            Logger.error('SAML: Failed calling backend action ' + requestData.action);
            return Promise.resolve(-1);
        }
        Logger.debug(response);

        return response.results[0][0]['user_id'];
    }

    private async getSamlSettings(): Promise<SamlSettings> {
        if (!this._samlSettings) {
            this._samlSettings = await this._datastore.get('organization', 1, [
                'saml_enabled',
                'saml_metadata_idp',
                'saml_metadata_sp',
                'saml_private_key'
            ]);
        }
        return this._samlSettings;
    }

    private async getSp(): Promise<samlify.ServiceProviderInstance> {
        samlify.setSchemaValidator({
            validate: () =>
                /* implment your own or always returns a resolved promise to skip */
                Promise.resolve('skipped')
        });
        return samlify.ServiceProvider({
            metadata: (await this.getSamlSettings()).saml_metadata_sp,
            privateKey: (await this.getSamlSettings()).saml_private_key
        });
    }

    private async getIdp(): Promise<samlify.IdentityProviderInstance> {
        return samlify.IdentityProvider({
            metadata: (await this.getSamlSettings()).saml_metadata_idp
        });
    }
}
