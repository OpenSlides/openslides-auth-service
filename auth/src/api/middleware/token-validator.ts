import express from 'express';
import jwt from 'jsonwebtoken';

import { Keys } from '../../config';
import { Constructable } from '../../util/di';
import { Validator } from '../interfaces/validator';

@Constructable(Validator)
export default class TokenValidator implements Validator {
    public name = 'TokenValidator';

    private readonly token = 'token';

    public validate(request: any, response: express.Response, next: express.NextFunction): express.Response | void {
        let token = (request.headers['authentication'] || request.headers['authorization']) as string;
        if (!token) {
            return response.json({
                success: false,
                message: 'Auth token is not supplied'
            });
        }
        const tokenParts = token.split(' ');
        if (!tokenParts[0].toLowerCase().startsWith('bearer')) {
            console.log('no bearer');
            return response.status(400).json({
                success: false,
                message: 'Wrong token'
            });
        }
        token = tokenParts[1];

        try {
            request[this.token] = jwt.verify(token, Keys.privateKey());
            next();
        } catch (e) {
            return response.json({
                success: false,
                message: `Token is not valid: ${e.message}`
            });
        }
    }
}
