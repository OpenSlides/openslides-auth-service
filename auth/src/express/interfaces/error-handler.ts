import { NextFunction, Request, Response } from 'express';

/**
 * Interface, that describes an error occurred from express-parser (like `json()`).
 */
export interface ExpressError {
    stack: string;
    received: number;
    expected: number;
    expose: boolean;
    status: number;
    type: string;
    message: string;
    body?: unknown;
}

export interface ErrorHandler {
    handleError(error: ExpressError, req: Request, res: Response, next: NextFunction): void;
}
