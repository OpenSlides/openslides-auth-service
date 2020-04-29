import { InjectableClass } from '../../core/modules/decorators';

export class DatabasePort extends InjectableClass {
    public set: <T>(prefix: string, key: string, obj: T) => Promise<boolean>;
    public get: <T>(prefix: string, key: string) => Promise<T | null>;
    public getAll: <T>(prefix: string) => Promise<T[]>;
    public update: <T>(prefix: string, key: string, update: Partial<T>) => Promise<T>;
    public remove: (prefix: string, key: string) => Promise<boolean>;
}
