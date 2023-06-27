import { Request, Response } from 'express';
import { Factory } from 'final-di';
import { OnGet, OnPost, Req, Res, RestController } from 'rest-app';
import * as samlify from 'samlify';
import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { AuthHandler } from '../../api/interfaces/auth-handler';
import { Datastore } from '../../api/interfaces/datastore';
import { HttpHandler } from '../../api/interfaces/http-handler';
import { AuthService } from '../../api/services/auth-service';
import { HttpService } from '../../api/services/http-service';
import { Logger } from '../../api/services/logger';
import { Config } from '../../config';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';

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

    private samlSettings: SamlSettings;

    /**
     * Indicates if the service is available
     * @returns Generic response
     */
    @OnGet()
    public async index(): Promise<AuthServiceResponse> {
        return createResponse({}, 'SAML SP service is available');
    }

    /**
     * Loads the metadata of the SAML service provider
     * @param res Response
     */
    @OnGet()
    public async metadata(@Res() res: Response) {
        res.header('Content-Type', 'text/xml').send((await this.getSamlSettings()).saml_metadata_sp);
    }

    /**
     * SAML SP: Initiates the login process and redirects to the SAML IDP.
     * @param res Response
     * @returns Redirect to SAML IDP
     */
    @OnGet()
    public async send(@Res() res: Response): Promise<void> {
        const { id, context } = (await this.getSp()).createLoginRequest(await this.getIdp(), 'redirect');
        return res.redirect(context);
    }

    /**
     * Generates the SAML login url for client redirection.
     * @param res Response
     * @returns SAML Login Url
     */
    @OnGet()
    public async getUrl(@Res() res: Response): Promise<AuthServiceResponse> {
        const sp = await this.getSp();
        const idp = await this.getIdp();
        const { id, context } = sp.createLoginRequest(idp, 'redirect');
        return createResponse({}, context);
    }

    /**
     * SAML SP: Receives the SAML response from the SAML IDP, handels authentication and redirects to the frontend.
     * @param req Request
     * @param res Response
     * @returns
     */
    @OnPost()
    public async acs(@Req() req: Request, @Res() res: Response): Promise<void> {
        console.debug('SAML: ACS');
        const sp = await this.getSp();
        const idp = await this.getIdp();

        const { extract } = await sp.parseLoginResponse(idp, 'post', req);
        const { username } = extract.attributes;

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
    private async provisionUser(attributes: any): Promise<number> {
        Logger.debug('SAML: Creating new user: ' + attributes.username);

        return this.makeBackendCall({
            action: 'user.save_saml_account',
            data: [attributes]
        });
    }

    private async makeBackendCall(requestData: SamlBackendCall): Promise<number> {
        const url = Config.ACTION_URL + '/system/action/handle_request';
        const response: any = await this._httpHandler.post(url, [requestData]);

        if (response.status !== 200) {
            Logger.error('SAML: Failed calling backend action ' + requestData.action);
            return Promise.resolve(-1);
        }
        Logger.debug(response);
        return Promise.resolve(response.results[0][0]['user_id']);
    }

    private async getSamlSettings(): Promise<SamlSettings> {
        if (!this.samlSettings) {
            this.samlSettings = await this._datastore.get('organization', 1, [
                'saml_enabled',
                'saml_metadata_idp',
                'saml_metadata_sp',
                'saml_private_key'
            ]);
        }
        return this.samlSettings;
    }

    private async getSp(): Promise<samlify.ServiceProviderInstance> {
        samlify.setSchemaValidator({
            validate: (response: string) => {
                /* implment your own or always returns a resolved promise to skip */
                return Promise.resolve('skipped');
            }
        });
        return samlify.ServiceProvider({
            metadata: (await this.getSamlSettings()).saml_metadata_sp
        });
    }

    private async getIdp(): Promise<samlify.IdentityProviderInstance> {
        return samlify.IdentityProvider({
            metadata: (await this.getSamlSettings()).saml_metadata_idp
        });
    }
}
