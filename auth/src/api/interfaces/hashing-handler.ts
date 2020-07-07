import crypto from 'crypto';

import { InjectableClass } from '../../util/di';

export abstract class HashingHandler extends InjectableClass {
    /**
     * This function hashes a given value.
     *
     * @param value The value to hash.
     *
     * @returns The hashed value.
     */
    public abstract hash(value: string): string;

    /**
     * This function hashes a given value by `sha512` and adds a salt value.
     *
     * @param value The value, which is hashed.
     * @param salt A salt value, which is appended to the previous value.
     *
     * @returns The hashed value.
     */
    protected sha512(value: string, salt: string): string {
        const sha = crypto
            .createHash('sha512')
            .update(value)
            .digest('base64');

        // const hmac = crypto
        //     .createHmac('sha512', salt)
        //     .update(value)
        //     .digest('base64');
        // console.log('sha', sha);
        // console.log('hmac', hmac);
        // console.log('sha vs hmac:', sha.length, hmac.length);
        // return hmac;
        return sha;
    }
}
