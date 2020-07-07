import { Datastore } from '../api/interfaces/datastore';
import { User } from '../core/models/user';
import { Constructable, Inject } from '../util/di';
import { HttpHandler } from '../api/interfaces/http-handler';
import { HttpService } from '../api/services/http-service';

@Constructable(Datastore)
export class DatastoreAdapter extends Datastore {
    @Inject(HttpHandler)
    private readonly httpHandler: HttpService;

    public find(userId: string): User {
        return {} as User;
    }

    public findUserByCredentials(username: string, password: string): User {
        return {} as User;
    }

    public hasUser(username: string): boolean {
        const user = this.getUserByUsername(username);
        return !!user;
    }

    public async filter<T>(
        collection: string,
        filterField: keyof T,
        filterValue: any,
        mappedFields?: (keyof T)[]
    ): Promise<T> {
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

    protected async getUserByUsername(username: string): Promise<User> {
        const user = await this.httpHandler.post(`${this.datastoreReader}/filter`, {
            collection: 'user',
            filter: {
                field: 'username',
                value: username,
                operator: '='
            },
            mapped_fields: ['username', 'password', 'id']
        });
        console.log('user', user);
        return user as User;
    }
}
