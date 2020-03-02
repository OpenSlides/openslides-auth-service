import express from 'express';
import jwt from 'jsonwebtoken';

import { secret } from '../config/config';

export default class TokenGenerator {
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
}
