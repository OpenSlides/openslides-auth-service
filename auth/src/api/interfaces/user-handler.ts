import { InjectableClass } from '../../util/di';
import { User } from '../../core/models/user/user';

export abstract class UserHandler extends InjectableClass {
    // public create: (username: string, password: string) => Promise<User>;
    // public getUserByCredentials: (username: string, password: string) => Promise<User | undefined>;
    // public getUserBySessionId: (sessionId: string) => Promise<User | undefined>;
    // public hasUser: (username: string, password: string) => Promise<boolean>;
    // public getAllUsers: () => User[];
    public abstract async create(username: string, password: string): Promise<User>;
}
