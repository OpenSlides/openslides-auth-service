import express from 'express';
import jwt from 'jsonwebtoken';

import { Keys } from '../../config';
import { Constructable } from '../../core/modules/decorators';
import { Cookie, Token } from '../interfaces/generator';
import { Validator } from '../interfaces/validator';

@Constructable(Validator)
export default class TokenValidator implements Validator {
    public name = 'TokenValidator';

    private readonly token = 'token';

    public static verifyCookie(cookieAsString: string): Cookie {
        return jwt.verify(cookieAsString, Keys.privateCookieKey()) as Cookie;
    }

    public static verifyToken(tokenAsString: string): Token {
        return jwt.verify(tokenAsString, Keys.privateKey()) as Token;
    }

    public static parseCookie(cookieAsString: string): Cookie {
        return TokenValidator.decodeToken<Cookie>(cookieAsString);
    }

    public static parseToken(tokenAsString: string): Token {
        return TokenValidator.decodeToken<Token>(tokenAsString);
    }

    private static decodeToken<T>(tokenString: string): T {
        const parts = tokenString.split('.');
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload) as T;
    }

    public isValid(request: any, response: express.Response, next: express.NextFunction): express.Response | void {
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
