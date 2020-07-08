import { Datastore } from '../api/interfaces/datastore';
import { Constructable, Inject } from '../util/di';
import { HttpHandler } from '../api/interfaces/http-handler';
import { HttpService } from '../api/services/http-service';

@Constructable(Datastore)
export class DatastoreAdapter extends Datastore {
    @Inject(HttpService)
    private readonly httpHandler: HttpHandler;

    public async filter<T>(
        collection: string,
        filterField: keyof T,
        filterValue: any,
        mappedFields?: (keyof T)[]
    ): Promise<any> {
        return await this.httpHandler.post(`${this.datastoreReader}/filter`, {
            collection,
            filter: {
                field: filterField,
                value: filterValue,
                operator: '='
            },
            mapped_fields: mappedFields
        });
    }
    public async get<T>(collection: string, id: any, mappedFields?: (keyof T)[]): Promise<T> {
        return await this.httpHandler.get(`${this.datastoreReader}/get`, {
            fqid: `${collection}/${id}`,
            mapped_fields: mappedFields
        });
    }
    public async exists<T>(
        collection: string,
        filterField: keyof T,
        filterValue: any
    ): Promise<{ exists: boolean; position: number }> {
        return await this.httpHandler.post(`${this.datastoreReader}/exists`, {
            collection,
            filter: { field: filterField, value: filterValue, operator: '=' }
        });
    }
}
