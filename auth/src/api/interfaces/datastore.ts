import { Config } from '../../config';

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

    public abstract filter<T>(
        collection: string,
        filterField: keyof T,
        filterValue: any,
        mappedFields: (keyof T)[]
    ): Promise<GetManyAnswer<T>>;
    public abstract get<T>(collection: string, id: any, mappedFields: (keyof T)[]): Promise<any>;
    public abstract exists<T>(
        collection: string,
        filterField: keyof T,
        filterValue: any
    ): Promise<{ exists: boolean; position: number }>;
}
