import { Request, Response } from 'express';
import { Factory } from 'final-di';
import { OnGet, OnPost, Req, Res, RestController } from 'rest-app';
import * as samlify from 'samlify';

import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { AuthHandler } from '../../api/interfaces/auth-handler';
import { Datastore } from '../../api/interfaces/datastore';
import { HttpHandler, HttpResponse } from '../../api/interfaces/http-handler';
import {
    SamlHandler,
    SamlAttributes,
    SamlBackendCall,
    SamlHttpResponse,
    SamlSettings,
    SamlUser
} from '../../api/interfaces/saml-handler';
import { SecretHandler } from '../../api/interfaces/secret-handler';
import { UserHandler } from '../../api/interfaces/user-handler';
import { AuthService } from '../../api/services/auth-service';
import { HttpService } from '../../api/services/http-service';
import { Logger } from '../../api/services/logger';
import { SecretService } from '../../api/services/secret-service';
import { UserService } from '../../api/services/user-service';
import { Config } from '../../config';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const INTERNAL_AUTHORIZATION_HEADER = 'Authorization';

export class SamlService extends SamlHandler {
    @Factory(HttpService)
    private readonly _httpHandler: HttpHandler;

    @Factory(DatastoreAdapter)
    private readonly _datastore: Datastore;

    @Factory(SecretService)
    private readonly _secretHandler: SecretHandler;

    private _samlSettings: SamlSettings;

    /**
     * Creates a new OpenSlides user in the DB via backend action 'user.create_saml_account'.
     *
     * @param attributes raw attributes send by SAML IDP
     */
    public async provisionUser(attributes: SamlAttributes): Promise<number> {
        Logger.debug('SAML: Creating new user: ' + attributes.username);

        return this.makeBackendCall({
            action: 'user.save_saml_account',
            data: [attributes]
        });
    }

    public async makeBackendCall(requestData: SamlBackendCall): Promise<number> {
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

    public async getSamlSettings(): Promise<SamlSettings> {
        if (!this._samlSettings) {
            this._samlSettings = await this._datastore.get('organization', 1, [
                'saml_enabled',
                'saml_metadata_idp',
                'saml_metadata_sp',
                'saml_private_key',
                'saml_attr_mapping'
            ]);
        }
        return this._samlSettings;
    }

    public async getSp(): Promise<samlify.ServiceProviderInstance> {
        samlify.setSchemaValidator({
            validate: () =>
                /* implment your own or always returns a resolved promise to skip */
                Promise.resolve('skipped')
        });
        return samlify.ServiceProvider({
            metadata: (await this.getSamlSettings()).saml_metadata_sp,
            privateKey: (await this.getSamlSettings()).saml_private_key,
            allowCreate: false
        });
    }

    public async getIdp(): Promise<samlify.IdentityProviderInstance> {
        return samlify.IdentityProvider({
            metadata: (await this.getSamlSettings()).saml_metadata_idp
        });
    }
}
