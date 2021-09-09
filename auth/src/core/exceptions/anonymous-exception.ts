import { BaseException } from './base-exception';

export class AnonymousException extends BaseException {
    public constructor() {
        super('User is anonymous');
    }
}
