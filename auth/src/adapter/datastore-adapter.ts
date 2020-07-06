import { Datastore } from 'src/api/interfaces/datastore';
import { User } from 'src/core/models/user/user';
import { Constructable } from 'src/util/di';

@Constructable(Datastore)
export class DatastoreAdapter implements Datastore {
    public name = 'DatastoreAdapter';

    public find(userId: string): User {
        return {} as User;
    }

    public hasUser(username: string, password: string): string {
        return '';
    }
}
