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
    /**
     * This returns the object stored under the given id in the collection table.
     *
     * @param collection The collection, the object is part of.
     * @param id The id, under which the object is stored.
     * @param mappedFields The fields of the object that should be loaded.
     *
     * @returns The object.
     */
    public abstract get<T extends BaseModel>(collection: string, id: Id, mappedFields: (keyof T)[]): Promise<T>;

    /**
     * This returns all objects containing the filterValue in the filterField in the collection table.
     *
     * @param collection The collection, the object is part of.
     * @param filterField The name of the field, that should be compared.
     * @param filterField The content, that the field value should be compared with.
     * @param mappedFields The fields of the objects that should be loaded.
     *
     * @returns The objects as an id:object dict.
     */
    public abstract filter<T extends BaseModel>(
        collection: string,
        filterField: keyof T,
        filterValue: string | number,
        mappedFields: (keyof T)[]
    ): Promise<GetManyAnswer<T>>;

    /**
     * Writes the content of the writeRequest into the database
     * @param writeRequest what should be written.
     */
    public abstract write(writeRequest: WriteRequest): Promise<void>;
}
