import { AuthServiceResponse } from './definitions';

export const createResponse = (
    data?: { [key: string]: any },
    message: string = 'Action handled successfully',
    success: boolean = true
): AuthServiceResponse => ({ message, success, ...data });
