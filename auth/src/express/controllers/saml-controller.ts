import { Request, Response } from 'express';
import { Factory } from 'final-di';
import { TokenExpiredError } from 'jsonwebtoken';
import { Body, Cookie, OnGet, OnPost, Req, Res, RestController } from 'rest-app';

import { AuthHandler } from '../../api/interfaces/auth-handler';
import { AuthService } from '../../api/services/auth-service';
import { Logger } from '../../api/services/logger';
import { AnonymousException } from '../../core/exceptions/anonymous-exception';
import { anonymous } from '../../core/models/anonymous';
import { AuthServiceResponse } from '../../util/helper/definitions';
import { createResponse } from '../../util/helper/functions';
import saml from '../../saml';
import { Datastore, EventType } from '../../api/interfaces/datastore';
import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { User } from '../../core/models/user';
import { UserHandler } from '../../api/interfaces/user-handler';
import { UserService } from '../../api/services/user-service';

const userFields: (keyof User)[] = ['id', 'username', 'password', 'is_active', 'meta_deleted'];

@RestController({
    prefix: 'saml'
})
export class SamlController {
    @Factory(AuthService)
    private _authHandler: AuthHandler;

    @Factory(UserService)
    private _userHandler: UserHandler;

    @Factory(DatastoreAdapter)
    private readonly _datastore: Datastore;

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
     * Has to be called with a GET request via the frontend.
     * @param res Response
     * @returns Redirect to SAML IDP
     */
    @OnGet()
    public send(@Res() res: Response): void {
        const { id, context } = saml.sp.createLoginRequest(saml.idp, 'redirect');
        return res.redirect(context);
    }

    /**
     * SAML SP: Receives the SAML response from the SAML IDP, handels authentication and redirects to the frontend.
     * @param req Request
     * @param res Response
     * @returns 
     */
    @OnPost()
    public async acs(@Req() req: Request, @Res() res: Response) {
        console.debug('->SAML ACS<-')

        const { extract } = await saml.sp.parseLoginResponse(saml.idp, 'post', req);

        // Attributes from SAML IDP
        const { username } = extract.attributes;

        // Todo: Check if the User is already exists in DB
        const checkUser = await this._datastore.exists<User>('user', 'username', username);

        if (!checkUser.exists) {
            // Todo: New user. Create new User in DB and set generall attributes send by SAML IDP (e.g. email, group, permissions, etc.)
            // this.provisionUser(extract.attributes);
        }
        // Todo: when a known user logs in agin, some attributes should be updated in the DB.

        const ticket =  await this._authHandler.doSamlLogin(username);

        res.setHeader(AuthHandler.AUTHENTICATION_HEADER, ticket.token.toString());
        res.cookie(AuthHandler.COOKIE_NAME, ticket.cookie.toString(), { secure: true, httpOnly: true });
        return createResponse();
    }

    @OnGet()
    public async list() {
        const l = await this._datastore.filter<User>('user', 'username', '*', []);
        console.log(l)
        return createResponse(l, 'ok');
    }

    /**
     * Not working right now.
     * 
     * @param attributes 
     */
    private provisionUser(attributes: any): void {
        const { username, firstname, lastname, email } = attributes;

        // https://github.com/OpenSlides/openslides-backend/blob/main/global/meta/models.yml
        // https://github.com/OpenSlides/OpenSlides/wiki/user.create

        // Todo: now clue how to create a new user in the datastore
        this._datastore.write({
            user_id: 0, // ??
            information: {},
            locked_fields: {},
            events: [
                {
                    type: EventType.CREATE,
                    fqid: 'user/99', // ??
                    fields: {
                        username: username,
                        gender: 'gender',
                        is_active: true,
                        meta_deleted: false,
                        is_physical_person: true,
                        first_name: firstname,
                        last_name: lastname,
                        email: email,


                    }
                }
            ]
        });
    }
}
