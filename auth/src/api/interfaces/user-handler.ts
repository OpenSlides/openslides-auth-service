import { Id } from 'src/core/key-transforms';

import { User } from '../../core/models/user';

export abstract class UserHandler {
    public abstract getUserByCredentials(username: string, password: string): Promise<User>;
    public abstract getUserByUserId(userId: Id): Promise<User>;
}
