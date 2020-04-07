import express from 'express';
import jwt from 'jsonwebtoken';

import { SECRET } from '../../config';

export default class TokenValidator {
    public checkToken(
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
    ): express.Response | void {
        let token = (request.headers['x-access-token'] || request.headers['authorization']) as string;
        if (!token) {
            return response.status(403).json({
                success: false,
                message: 'Auth token is not supplied'
            });
        }
        if (token.startsWith('Bearer')) {
            token = token.slice(7, token.length);
        }

        jwt.verify(token, SECRET, (error, decoded) => {
            if (error) {
                return response.json({
                    success: false,
                    message: 'Token is not valid: ' + error.message
                });
            } else {
                // @ts-ignore
                request.decoded = decoded;
                next();
            }
        });
    }
}
