import { InjectableClass } from '../../core/modules/decorators';

export class Database extends InjectableClass {
    public set: <T>(prefix: string, key: string, obj: T) => Promise<boolean>;
    public get: <T>(prefix: string, key: string) => Promise<T | null>;
    public getAll: <T>(prefix: string) => Promise<T[]>;
    public remove: (prefix: string, key: string) => Promise<boolean>;
    public clear: () => void;
}
