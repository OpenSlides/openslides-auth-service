import { BaseModel } from 'src/core/base/base-model';
import { Config } from '../../config';
import { Id } from '../../core/key-transforms';

export type Position = number;

export interface GetManyAnswer<T> {
    [key: string]: T;
}

export enum EventType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete'
}

interface Event {
    fqid: string;
    type: EventType;
}

export interface CreateEvent extends Event {
    type: EventType.CREATE;
    fields: { [key: string]: unknown };
}

export interface UpdateEvent extends Event {
    type: EventType.UPDATE;
    fields: { [key: string]: unknown };
}

export interface DeleteEvent extends Event {
    type: EventType.DELETE;
}

export type DatastoreEvent = CreateEvent | UpdateEvent | DeleteEvent;

export interface WriteRequest {
    user_id: number; // eslint-disable-line @typescript-eslint/naming-convention
    locked_fields: object; // eslint-disable-line
    information: object; // eslint-disable-line
    events: DatastoreEvent[];
}

export abstract class Datastore {
    protected datastoreReader = `${Config.DATASTORE_READER}/internal/datastore/reader`;
    protected datastoreWriter = `${Config.DATASTORE_WRITER}/internal/datastore/writer`;

    public abstract get<T extends BaseModel>(collection: string, id: Id, mappedFields: (keyof T)[]): Promise<T>;
    public abstract filter<T extends BaseModel>(
        collection: string,
        filterField: keyof T,
        filterValue: string | number,
        mappedFields: (keyof T)[]
    ): Promise<GetManyAnswer<T>>;
    public abstract write(writeRequest: WriteRequest): Promise<void>;
}
