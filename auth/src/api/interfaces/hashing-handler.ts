import { InjectableClass } from '../../util/di';

export abstract class HashingHandler extends InjectableClass {
    public abstract hash: (value: string) => string;
}
