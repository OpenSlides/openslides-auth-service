import * as samlify from 'samlify';

export interface SamlSettings {
    saml_enabled: string;
    saml_metadata_idp: string;
    saml_metadata_sp: string;
    saml_private_key: string;
    saml_attr_mapping: object;
}
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

export interface SamlBackendCall {
    action: string;
    data: [SamlUser];
}

export interface SamlAttributes extends SamlUser {
    username: string;
}

export interface SamlHttpResponse {
    results: { user_id: number }[][];
}
/* eslint-enable */

export abstract class SamlHandler {
    public abstract getSamlSettings(): Promise<SamlSettings>;
    public abstract makeBackendCall(requestData: SamlBackendCall): Promise<number>;
    public abstract provisionUser(attributes: SamlAttributes): Promise<number>;
    public abstract getSp(): Promise<samlify.ServiceProviderInstance>;
    public abstract getIdp(): Promise<samlify.IdentityProviderInstance>;
}
