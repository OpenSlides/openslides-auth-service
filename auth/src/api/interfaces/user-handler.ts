import { InjectableClass } from '../../util/di';
import { Validation } from './jwt-validator';
import { User } from '../../core/models/user';

export abstract class UserHandler extends InjectableClass {
    public abstract async getUserByCredentials(username: string, password: string): Promise<Validation<User>>;
    public abstract async getUserByUserId(userId: string): Promise<Validation<User>>;
    public abstract async hasUser(username: string): Promise<boolean>;
}
