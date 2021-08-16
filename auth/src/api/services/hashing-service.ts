import { Random } from '../../util/helper';
import { HashingHandler } from '../interfaces/hashing-handler';
import crypto from 'crypto';

export class HashingService extends HashingHandler {
    public hash(input: string): string {
        if (!input) {
            return '';
        }
        return this.sha512(input);
    }

    public isEquals(toHash: string, toCompare: string): boolean {
        if (!toHash || !toCompare || toCompare.length !== HashingHandler.HASHED_LENGTH) {
            return false;
        }
        return this.sha512(toHash, toCompare.slice(0, 64)) === toCompare;
    }

    /**
     * This function hashes a given value by `sha512` and adds a salt value.
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
