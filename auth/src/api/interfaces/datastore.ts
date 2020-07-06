import { InjectableClass } from '../../util/di';
import { User } from '../../core/models/user/user';

export class Datastore extends InjectableClass {
    public find: (userId: string) => User;
    public hasUser: (username: string, password: string) => string;
}
