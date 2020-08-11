import express from 'express';

export abstract class Validator {
    public abstract async validate(
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
    ): Promise<express.Response | void>;
}
