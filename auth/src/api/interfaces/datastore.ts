import { Config } from '../../config';
import { InjectableClass } from '../../util/di';
import { User } from '../../core/models/user';

export abstract class Datastore extends InjectableClass {
    public name = 'Datastore';

    protected datastoreReader = `${Config.DATASTORE_READER}/internal/datastore/reader`;
    protected datastoreWriter = `${Config.DATASTORE_WRITER}/internal/datastore/writer`;

    public abstract async filter<T>(
        collection: string,
        filterField: keyof T,
        filterValue: any,
        mappedFields: (keyof T)[]
    ): Promise<any>;
    public abstract async get<T>(collection: string, id: any, mappedFields: (keyof T)[]): Promise<any>;
    public abstract async exists<T>(
        collection: string,
        filterField: keyof T,
        filterValue: any
    ): Promise<{ exists: boolean; position: number }>;
}
