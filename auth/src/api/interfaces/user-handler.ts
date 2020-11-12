import { User } from '../../core/models/user';
import { Validation } from './validation';

export abstract class UserHandler {
    public abstract getUserByCredentials(username: string, password: string): Promise<Validation<User>>;
    public abstract getUserByUserId(userId: string): Promise<Validation<User>>;
    public abstract hasUser(username: string): Promise<boolean>;
}
