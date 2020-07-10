import { Config } from '../../config';
import { InjectableClass } from '../../util/di';

export type Position = number;

export interface GetManyAnswer<T> {
    [key: string]: T;
}

export interface ExistsAnswer {
    exists: boolean;
    position: Position;
}

export abstract class Datastore {
    public name = 'Datastore';

    protected datastoreReader = `${Config.DATASTORE_READER}/internal/datastore/reader`;
    protected datastoreWriter = `${Config.DATASTORE_WRITER}/internal/datastore/writer`;

    public abstract async filter<T>(
        collection: string,
        filterField: keyof T,
        filterValue: any,
        mappedFields: (keyof T)[]
    ): Promise<GetManyAnswer<T>>;
    public abstract async get<T>(collection: string, id: any, mappedFields: (keyof T)[]): Promise<any>;
    public abstract async exists<T>(
        collection: string,
        filterField: keyof T,
        filterValue: any
    ): Promise<{ exists: boolean; position: number }>;
}
