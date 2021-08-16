import { BaseException } from './base-exception';

export class AuthenticationException extends BaseException {
    public constructor(message: string) {
        super(message, 403);
    }

    public toString(): string {
        return this.message;
    }
}
