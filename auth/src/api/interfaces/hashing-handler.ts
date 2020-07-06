import { InjectableClass } from '../../util/di';

export class HashingHandler extends InjectableClass {
    public hash: (value: string) => string;
}
