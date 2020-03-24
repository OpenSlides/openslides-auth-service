import express from 'express';
// import jwt from 'express-jwt';
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

        // let status = {};
        jwt.verify(token, SECRET, (error, decoded) => {
            // console.log('token', error);
            if (error) {
                return response.json({
                    success: false,
                    message: 'Token is not valid: ' + error.message
                });
            } else {
                // status = {
                //     success: true,
                //     message: 'Everything is fine'
                // };
                // @ts-ignore
                request.decoded = decoded;
                next();
            }
        });
    }
}
