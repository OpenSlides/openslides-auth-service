import express from 'express';
import jwt from 'jsonwebtoken';
import querystring from 'querystring';

import ClientService from '../services/client-service';
import { secret } from '../config/config';

export default class TokenGenerator {
    private clientService = ClientService.getInstance();
    private codes: any = {};

    public login(request: express.Request, response: express.Response): void {
        const username = request.body.username;
        const password = request.body.password;

        const mockedUsername = 'admin';
        const mockedPassword = 'admin';

        if (!username || !password) {
            response.json({
                success: false,
                message: 'Authentication failed! Please check the request'
            });
            return;
        }
        if (username === mockedUsername && password === mockedPassword) {
            const token = jwt.sign({ username }, secret, { expiresIn: '10m' });
            response.json({
                success: true,
                message: 'Authentication successful!',
                token
            });
        } else {
            response.status(403).json({
                success: false,
                message: 'Incorrect username or password'
            });
        }
    }

    public generateToken(request: express.Request, response: express.Response): void {
        const auth = request.headers['authorization'];
        let clientId = '';
        let clientSecret = '';
        if (auth) {
            const clientCredentials = Buffer.from(auth.slice('basic '.length), 'base64')
                .toString()
                .split(':');
            clientId = querystring.unescape(clientCredentials[0]);
            clientSecret = querystring.unescape(clientCredentials[1]);
        }

        if (request.body.client_id) {
            if (clientId !== '') {
                response.status(401).json({ error: 'invalid client' });
                return;
            }

            clientId = request.body.client_id;
            clientSecret = request.body.client_secret;
        }

        const client = this.clientService.getClientById(clientId);
        if (!client) {
            // console.log('Unknown client %s', clientId);
            response.status(401).json({ error: 'invalid_client' });
            return;
        }

        if (client.clientSecret !== clientSecret) {
            response.status(401).json({ error: 'invalid_client' });
            return;
        }

        if (request.body.grant_type === 'authorization_code') {
            const code = this.codes[request.body.code];

            if (code) {
                delete this.codes[request.body.code];
                if (code.authorizationEndpointRequest.client_id === clientId) {
                    const accessToken = 'randomstring';
                    let cscope = null;
                    if (code.cscope) {
                        cscope = code.cscope.join(' ');
                    }

                    // insert to database
                    console.log('Issuing access token %s', accessToken);
                    console.log('with scope %s', cscope);

                    const tokenResponse = { access_token: accessToken, token_type: 'Bearer', scope: cscope };
                    response.status(200).json(tokenResponse);

                    console.log('Issued tokens for code %s', request.body.code);
                    return;
                } else {
                    console.log(
                        'Client mismatch, expected %s got %s',
                        code.authorizationEndpointRequest.client_id,
                        clientId
                    );
                    response.status(400).json({ error: 'invalid_grant' });
                    return;
                }
            } else {
                console.log('Unknown code, %s', request.body.code);
                response.status(400).json({ error: 'invalid_grant' });
                return;
            }
        } else {
            console.log('Unknown grant type %s', request.body.grant_type);
            response.status(400).json({ error: 'unsupported_grant_type' });
        }
    }

    public index(_: any, response: express.Response): void {
        response.json({
            success: true,
            message: 'Index page'
        });
    }

    public secureIndex(_: any, response: express.Response): void {
        response.json({
            success: true,
            message: 'Yeah! A secured page'
        });
    }

    private getClient(): any {}
}
