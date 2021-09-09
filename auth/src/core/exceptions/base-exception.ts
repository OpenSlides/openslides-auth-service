import { BaseError } from 'rest-app';

export abstract class BaseException extends BaseError {
    public readonly title: string;

    public constructor(message: string, statusCode: number = 403) {
        super(message, { statusCode });

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BaseException);
        }

        this.title = message.split('\n')[0];
    }
}
