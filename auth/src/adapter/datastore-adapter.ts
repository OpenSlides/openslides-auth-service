import { Datastore } from '../api/interfaces/datastore';
import { User } from '../core/models/user';
import { Constructable } from '../util/di';

@Constructable(Datastore)
export class DatastoreAdapter implements Datastore {
    public name = 'DatastoreAdapter';

    public find(userId: string): User {
        return {} as User;
    }

    public findUserByCredentials(username: string, password: string): User {
        return {} as User;
    }

    public hasUser(username: string): boolean {
        return false;
    }
}
