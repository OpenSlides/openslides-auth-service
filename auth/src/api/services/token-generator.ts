import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import { uuid } from 'uuidv4';

import ClientService from '../../model-services/client-service';
import { ClientServiceInterface } from '../../model-services/client-service.interface';
import { SECRET, SECRET_COOKIE } from '../../config';
import { Inject } from '../../core/modules/decorators';

export default class TokenGenerator {
    @Inject(ClientServiceInterface)
    private clientService: ClientService;

    public constructor() {
        this.insertMockData();
    }

    public async login(request: express.Request, response: express.Response): Promise<void> {
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
            const refreshId = uuid();
            const clientId = uuid();
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

    private insertMockData(): void {
        if (this.clientService) {
            this.clientService.create('admin', 'admin');
        }
    }
}
