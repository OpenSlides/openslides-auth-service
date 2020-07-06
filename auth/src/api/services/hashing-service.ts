import { HashingHandler } from '../interfaces/hashing-handler';
import { Constructable } from '../../util/di';

@Constructable(HashingHandler)
export class HashingService implements HashingHandler {
    public name = 'HashingService';

    public hash(input: string): string {
        return '';
    }
}
