import { Constructable } from '../../util/di';
import { HashingHandler } from '../interfaces/hashing-handler';
import { Random } from '../../util/helper';

@Constructable(HashingHandler)
export class HashingService extends HashingHandler {
    public name = 'HashingService';

    public hash(input: string): string {
        const salt = Random.cryptoKey();
        console.log('salt', salt);
        return this.sha512(input, salt);
    }
}
