import * as argon2 from 'argon2';

import { Random } from '../../util/helper';
import { HashingHandler } from '../interfaces/hashing-handler';
import crypto from 'crypto';

export class HashingService extends HashingHandler {
    private static readonly ARGON2_HASH_START = '$argon2';

    public async hash(input: string): Promise<string> {
        if (!input) {
            return '';
        }
        return await argon2.hash(input);
    }

    public isDeprecatedHash(hash: string): boolean {
        return this.isSHA512Hash(hash);
    }

    private isSHA512Hash(hash: string): boolean {
        return !hash?.startsWith(HashingService.ARGON2_HASH_START) && hash?.length === HashingHandler.SHA512_HASHED_LENGTH;
    }

    private isArgon2Hash(hash: string): boolean {
        return hash?.startsWith(HashingService.ARGON2_HASH_START);
    }

    public async isEquals(toHash: string, toCompare: string): Promise<boolean> {
        if (!toHash || !toCompare) {
            return false;
        }
        if (this.isArgon2Hash(toCompare)) {
            return await argon2.verify(toCompare, toHash);
        } else if (this.isSHA512Hash(toCompare)) {
            return crypto.timingSafeEqual(
                Buffer.from(this.sha512(toHash, toCompare.slice(0, 64))),
                Buffer.from(toCompare)
            );
        } else {
            return false;
        }
    }

    /**
     * This function hashes a given value by `sha512` and adds a salt value.
     *
     * DEPRECATED: Use `argon2` instead to hash passwords.
     *
     * @param value The value, which is hashed.
     * @param salt A salt value, which is appended to the previous value.
     *
     * @returns The hashed value.
     */
    private sha512(value: string, salt?: string): string {
        const withSalt = salt ? salt : Random.cryptoKey(64);
        const hashValue = crypto.createHash('sha512').update(value).update(withSalt).digest('base64');
        return withSalt + hashValue;
    }
}
