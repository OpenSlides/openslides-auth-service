import { NextFunction, Request, Response } from 'express';

/**
 * Interface, that describes an error occurred from express-parser (like `json()`).
 */
export interface Error {
    stack: string;
    received: number;
    expected: number;
    expose: boolean
    status: number
    type: string
    message: string
    body?: unknown
}

export interface ErrorHandler {
    handleError(error: Error, req: Request, res: Response, next: NextFunction): void;
}
