import { Factory } from 'final-di';

import { Datastore, GetManyAnswer, WriteRequest } from '../api/interfaces/datastore';
import { HttpHandler } from '../api/interfaces/http-handler';
import { HttpService } from '../api/services/http-service';
import { Id } from '../core/key-transforms';

interface FilterResponse<T> {
    position: number; // The current position of the datastore
    data: GetManyAnswer<T>;
}

export class DatastoreAdapter extends Datastore {
    @Factory(HttpService)
    private readonly _httpHandler: HttpHandler;

    public async get<T>(collection: string, id: Id, mappedFields?: (keyof T)[]): Promise<T> {
        return (await this._httpHandler.post(
            `${this.datastoreReader}/get`,
            {
                fqid: `${collection}/${id}`,
                mapped_fields: mappedFields
            },
            {},
            { observe: 'data' }
        )) as T;
    }

    public async filter<T>(
        collection: string,
        filterField: keyof T,
        filterValue: string | number,
        mappedFields?: (keyof T)[]
    ): Promise<GetManyAnswer<T>> {
        const response = await this._httpHandler.post<FilterResponse<T>>(
            `${this.datastoreReader}/filter`,
            {
                collection,
                filter: {
                    field: filterField,
                    value: filterValue,
                    operator: '='
                },
                mapped_fields: mappedFields
            },
            {},
            { observe: 'data' }
        );
        return (response as FilterResponse<T>).data;
    }

    public async write(writeRequest: WriteRequest): Promise<void> {
        await this._httpHandler.post(`${this.datastoreWriter}/write`, { ...writeRequest });
    }
}
