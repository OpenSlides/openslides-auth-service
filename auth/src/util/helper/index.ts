import crypto from 'crypto';
import cryptoRandomString from 'crypto-random-string';

export namespace Random {
    /**
     * Generates a cryptographically key with a specified key length.
     *
     * @param length The length of the returned string.
     *
     * @returns The generated key.
     */
    export function cryptoKey(length: number = 32): string {
        // return cryptoRandomString(length);
        const c = crypto.randomBytes(Math.ceil(length / 2));
        console.log('c:', c);
        const str = c.toString('hex');
        console.log('str', str);
        console.log(
            'crypto random key',
            crypto
                .randomBytes(Math.ceil(length / 2))
                .toString('hex')
                .slice(0, length)
        );
        return crypto
            .randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }
}
