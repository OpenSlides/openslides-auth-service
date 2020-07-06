import cryptoRandomString from 'crypto-random-string';

/**
 * Generates a cryptographically key with a specified key length.
 *
 * @param length The length of the returned string.
 *
 * @returns The generated key.
 */
export function cryptoKey(length: number = 16): string {
    return cryptoRandomString(length);
}
