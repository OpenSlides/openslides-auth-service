import { InjectableClass } from '../../util/di';
import { User } from '../../core/models/user';

export abstract class Datastore extends InjectableClass {
    public abstract find(userId: string): User;
    public abstract findUserByCredentials(username: string, password: string): User;
    public abstract hasUser(username: string): boolean;
}
