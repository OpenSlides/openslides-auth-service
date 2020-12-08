export abstract class BaseException extends Error {
    public readonly title: string;

    public constructor(message: string) {
        super(message);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BaseException);
        }

        this.title = message.split('\n')[0];
    }
}
