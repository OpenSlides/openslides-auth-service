import { InjectableClass } from '../../core/modules/decorators';

export class DatabasePort extends InjectableClass {
    set: <T>(prefix: string, key: string, obj: T) => Promise<boolean>;
    get: <T>(prefix: string, key: string) => Promise<T | null>;
    getAll: <T>(prefix: string) => Promise<T[]>;
    update: <T>(prefix: string, key: string, update: Partial<T>) => Promise<T>;
    remove: (prefix: string, key: string) => Promise<boolean>;
}
