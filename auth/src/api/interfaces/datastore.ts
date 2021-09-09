import { Config } from '../../config';
import { Id } from '../../core/key-transforms';

export type Position = number;

export interface GetManyAnswer<T> {
    [key: string]: T;
}

export interface ExistsAnswer {
    exists: boolean;
    position: Position;
}

export abstract class Datastore {
    protected datastoreReader = `${Config.DATASTORE_READER}/internal/datastore/reader`;

    public abstract filter<T>(
        collection: string,
        filterField: keyof T,
        filterValue: string | number,
        mappedFields: (keyof T)[]
    ): Promise<GetManyAnswer<T>>;
    public abstract get<T>(collection: string, id: Id, mappedFields: (keyof T)[]): Promise<any>;
    public abstract exists<T>(
        collection: string,
        filterField: keyof T,
        filterValue: string | number
    ): Promise<{ exists: boolean; position: number }>;
}
