import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import { uuid } from 'uuidv4';

import ClientService from '../../model-services/client-service';
import { ClientServiceInterface } from '../../model-services/client-service.interface';
import { SECRET, SECRET_COOKIE } from '../../config';
import DatabaseAdapter from '../../adapter/services/database-adapter';
import { DatabasePort } from '../../adapter/interfaces/database-port';
import { Inject } from '../../core/modules/decorators';

export default class TokenGenerator {
    @Inject(ClientServiceInterface)
    private clientService: ClientService;
    // private readonly crypto = crypto.subtle;
    // private readonly signKey: any;
    // private codes: any = {};
    @Inject(DatabasePort)
    private database: DatabaseAdapter;

    public constructor() {
        // this.signKey = this.crypto.generateKey('HMAC', false, ['sign', 'verify']);
        this.insertMockData();
    }

    public async login(request: express.Request, response: express.Response): Promise<void> {
        const username = request.body.username;
        const password = request.body.password;

        const mockedUsername = 'admin';
        const mockedPassword = 'admin';
        // const user = await this.database.getUserByName('admin');

        if (!username || !password) {
            response.json({
                success: false,
                message: 'Authentication failed! Please check the request'
            });
            return;
        }
        if (username === mockedUsername && password === mockedPassword) {
            const refreshId = uuid();
            const clientId = uuid();
            // const signature = await this.crypto.sign('HMAC', this.signKey, new ArrayBuffer(64));
            const token = jwt.sign({ username, expiresIn: '10m', refreshId, clientId }, SECRET, {
                expiresIn: '10m'
            });

            cookieParser(SECRET_COOKIE);
            response.cookie('refreshId', refreshId, { httpOnly: true, secure: false });
            response.json({
                success: true,
                message: 'Authentication successful!',
                token,
                refreshId
            });
        } else {
            response.status(403).json({
                success: false,
                message: 'Incorrect username or password'
            });
        }
    }

    public refreshToken(request: express.Request, reponse: express.Response): void {
        const refreshToken = request.cookies['sessionId'];
        // const username = request.body.username;
        // const token = jwt.sign({username}, secret, {expiresIn: '1h'})
    }

    // This is for OAuth 2.0
    // public generateToken(request: express.Request, response: express.Response): void {
    //     const auth = request.headers['authorization'];
    //     let clientId = '';
    //     let clientSecret = '';
    //     if (auth) {
    //         const clientCredentials = Buffer.from(auth.slice('basic '.length), 'base64')
    //             .toString()
    //             .split(':');
    //         clientId = querystring.unescape(clientCredentials[0]);
    //         clientSecret = querystring.unescape(clientCredentials[1]);
    //     }

    //     if (request.body.client_id) {
    //         if (clientId !== '') {
    //             response.status(401).json({ error: 'invalid client' });
    //             return;
    //         }

    //         clientId = request.body.client_id;
    //         clientSecret = request.body.client_secret;
    //     }

    //     const client = this.clientService.getClientById(clientId);
    //     if (!client) {
    //         // console.log('Unknown client %s', clientId);
    //         response.status(401).json({ error: 'invalid_client' });
    //         return;
    //     }

    //     if (client.clientSecret !== clientSecret) {
    //         response.status(401).json({ error: 'invalid_client' });
    //         return;
    //     }

    //     if (request.body.grant_type === 'authorization_code') {
    //         const code = this.codes[request.body.code];

    //         if (code) {
    //             delete this.codes[request.body.code];
    //             if (code.authorizationEndpointRequest.client_id === clientId) {
    //                 const accessToken = 'randomstring';
    //                 let cscope = null;
    //                 if (code.cscope) {
    //                     cscope = code.cscope.join(' ');
    //                 }

    //                 // insert to database
    //                 console.log('Issuing access token %s', accessToken);
    //                 console.log('with scope %s', cscope);

    //                 const tokenResponse = { access_token: accessToken, token_type: 'Bearer', scope: cscope };
    //                 response.status(200).json(tokenResponse);

    //                 console.log('Issued tokens for code %s', request.body.code);
    //                 return;
    //             } else {
    //                 console.log(
    //                     'Client mismatch, expected %s got %s',
    //                     code.authorizationEndpointRequest.client_id,
    //                     clientId
    //                 );
    //                 response.status(400).json({ error: 'invalid_grant' });
    //                 return;
    //             }
    //         } else {
    //             console.log('Unknown code, %s', request.body.code);
    //             response.status(400).json({ error: 'invalid_grant' });
    //             return;
    //         }
    //     } else {
    //         console.log('Unknown grant type %s', request.body.grant_type);
    //         response.status(400).json({ error: 'unsupported_grant_type' });
    //     }
    // }

    public index(_: any, response: express.Response): void {
        response.json({
            success: true,
            message: 'Hello World'
        });
    }

    public secureIndex(_: any, response: express.Response): void {
        response.json({
            success: true,
            message: 'Yeah! A secured page'
        });
    }

    private getClient(): any {}

    private insertMockData(): void {
        if (this.database) {
            this.database.addClient({ username: 'admin', password: 'admin' });
            this.database.getClientByName('admin').then(() => console.log('fetched'));
        }
    }
}
