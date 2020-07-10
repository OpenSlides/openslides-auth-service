import express from 'express';

export abstract class Validator {
    public abstract validate(
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
    ): express.Response | void;
}
