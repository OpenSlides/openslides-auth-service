import { BaseException } from './base-exception';

export class AuthenticationException extends BaseException {
    public toString(): string {
        return this.message;
    }
}
