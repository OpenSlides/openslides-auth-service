import crypto from 'crypto';

import { HashingHandler } from '../interfaces/hashing-handler';

export class HashingService extends HashingHandler {
    public hash(input: string): string {
        return this.sha512(input);
    }

    /**
     * This function hashes a given value by `sha512` and adds a salt value.
     *
     * @param value The value, which is hashed.
     * @param salt A salt value, which is appended to the previous value.
     *
     * @returns The hashed value.
     */
    private sha512(value: string): string {
        return crypto
            .createHash('sha512')
            .update(value)
            .digest('base64');
    }
}
