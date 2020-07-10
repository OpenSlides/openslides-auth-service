import { User } from '../../core/models/user';
import { Validation } from './validation';

export abstract class UserHandler {
    public abstract async getUserByCredentials(username: string, password: string): Promise<Validation<User>>;
    public abstract async getUserByUserId(userId: string): Promise<Validation<User>>;
    public abstract async hasUser(username: string): Promise<boolean>;
}
