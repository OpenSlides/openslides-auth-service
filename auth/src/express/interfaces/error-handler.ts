import { NextFunction, Request, Response } from 'express';

export interface Error {
    stack: string;
}

export interface ErrorHandler {
    handleError(error: Error, req: Request, res: Response, next: NextFunction): void;
}
