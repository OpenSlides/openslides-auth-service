import { Request, Response, NextFunction } from 'express';

export interface SessionChecker {
    checkSession: (req: Request, res: Response, next: NextFunction) => any;
}
