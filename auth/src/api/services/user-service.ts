import { uuid } from 'uuidv4';

import { Database } from '../interfaces/database';
import { Datastore } from '../interfaces/datastore';
import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { Constructable, Inject } from '../../util/di';
import { HashingHandler } from '../interfaces/hashing-handler';
import { HashingService } from './hashing-service';
import { Validation } from '../interfaces/jwt-validator';
import { RedisDatabaseAdapter } from '../../adapter/redis-database-adapter';
import { User } from '../../core/models/user';
import { UserHandler } from '../interfaces/user-handler';

@Constructable(UserHandler)
export class UserService implements UserHandler {
    public name = 'UserService';

    @Inject(DatastoreAdapter)
    private readonly datastore: Datastore;

    @Inject(RedisDatabaseAdapter, User)
    private readonly database: Database;

    @Inject(HashingService)
    private readonly hashingHandler: HashingHandler;

    private readonly userCollection: Map<string, User> = new Map();

    public async create(username: string, password: string): Promise<User> {
        const userId = uuid();
        const user: User = new User({ username, password, userId });
        const done = await this.database.set(User.COLLECTION, userId, user);
        return user;
    }

    public async getUserByCredentials(username: string, password: string): Promise<Validation<any>> {
        const userObj = await this.datastore.filter<User>('user', 'username', username, [
            'username',
            'password',
            'default_password',
            'id'
        ]);
        const user: User = new User(userObj['1']);
        console.log('user', user);
        // if (!user) {
        //     return { isValid: false, message: 'Username or password is incorrect' };
        // }
        // if (user.password.slice(32) !== this.hashingHandler.hash(password)) {
        //     return { isValid: false, message: 'Username or password is incorrect' };
        // }
        return { isValid: true, message: 'successful', result: user };
    }

    public async getUserBySessionId(sessionId: string): Promise<Validation<User>> {
        return { isValid: false, message: 'Not implemented' };
    }

    public async getUserByUserId(userId: string): Promise<any> {
        return (await this.datastore.filter<User>('user', 'id', userId, ['username', 'password', 'id']))[
            User.COLLECTION
        ];
    }

    public async hasUser(username: string): Promise<boolean> {
        const answer = await this.datastore.exists<User>('user', 'username', username);
        return answer.exists;
    }

    public getAllUsers(): User[] {
        return Array.from(this.userCollection.values());
    }
}
