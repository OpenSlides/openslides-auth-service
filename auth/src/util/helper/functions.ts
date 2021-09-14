import { AuthServiceResponse } from './definitions';

export const createResponse = <T = unknown>(
    data?: T,
    message: string = 'Action handled successfully',
    success: boolean = true
): AuthServiceResponse => ({ message, success, ...data });
