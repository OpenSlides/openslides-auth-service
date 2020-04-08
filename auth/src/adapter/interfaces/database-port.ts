import { InjectableClass } from '../../core/modules/decorators';

export class DatabasePort extends InjectableClass {
    set: <T>(key: string, obj: T) => Promise<boolean>;
    get: <T>(key: string) => Promise<T | null>;
    update: <T>(key: string, update: Partial<T>) => Promise<T>;
    remove: (key: string) => Promise<boolean>;
}
