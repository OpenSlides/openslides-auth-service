import { BaseModel } from 'src/core/base/base-model';

import { Id } from '../../core/key-transforms';

export type Position = number;

export interface GetManyAnswer<T> {
    [key: string]: T;
}

export enum EventType {
    CREATE = 'create',
    UPDATE = 'update'
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

export type DatabaseEvent = CreateEvent | UpdateEvent;

export interface WriteRequest {
    user_id: number; // eslint-disable-line @typescript-eslint/naming-convention
    locked_fields: object; // eslint-disable-line
    information: object; // eslint-disable-line
    events: DatabaseEvent[];
}

export abstract class Database {
    public abstract get<T extends BaseModel>(collection: string, id: Id, mappedFields: (keyof T)[]): Promise<T>;
    public abstract filter<T extends BaseModel>(
        collection: string,
        filterField: keyof T,
        filterValue: string | number,
        mappedFields: (keyof T)[]
    ): Promise<GetManyAnswer<T>>;
    public abstract write(writeRequest: WriteRequest): Promise<void>;
}
