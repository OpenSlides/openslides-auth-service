import { InjectableClass } from '../../util/di';
import { User } from '../../core/models/user/user';

export abstract class Datastore extends InjectableClass {
    public abstract find: (userId: string) => User;
    public abstract hasUser: (username: string, password: string) => string;
}
