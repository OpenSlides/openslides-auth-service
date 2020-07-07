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
    export function cryptoKey(length: number = 16): string {
        // return cryptoRandomString(length);
        console.log(
            'crypto random key',
            crypto
                .randomBytes(Math.ceil(length / 2))
                .toString('hex')
                .slice(length)
        );
        return crypto
            .randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(length);
    }
}
