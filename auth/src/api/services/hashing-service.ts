import { Constructable } from '../../util/di';
import { HashingHandler } from '../interfaces/hashing-handler';

@Constructable(HashingHandler)
export class HashingService implements HashingHandler {
    public name = 'HashingService';

    public hash(input: string): string {
        return '';
    }
}
