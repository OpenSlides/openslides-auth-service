import { InjectableClass } from '../../util/di';

export abstract class Database {
    public abstract set<T>(prefix: string, key: string, obj: T): Promise<boolean>;
    public abstract get<T>(prefix: string, key: string): Promise<T | null>;
    public abstract getAll<T>(prefix: string): Promise<T[]>;
    public abstract remove(prefix: string, key: string): Promise<boolean>;
    protected abstract async clear(): Promise<boolean>;
}
