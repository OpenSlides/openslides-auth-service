import { Datastore, GetManyAnswer } from '../interfaces/datastore';
import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { Inject } from '../../util/di';
import { HashingHandler } from '../interfaces/hashing-handler';
import { HashingService } from './hashing-service';
import { Logger } from './logger';
import { User } from '../../core/models/user';
import { UserHandler } from '../interfaces/user-handler';
import { Validation } from '../interfaces/validation';

export class UserService implements UserHandler {
    public name = 'UserService';

    @Inject(DatastoreAdapter)
    private readonly datastore: Datastore;

    @Inject(HashingService)
    private readonly hashingHandler: HashingHandler;

    private readonly userCollection: Map<string, User> = new Map();

    public async getUserByCredentials(username: string, password: string): Promise<Validation<any>> {
        Logger.debug(`Gets user by credentials: ${username} and ${password}`);
        try {
            return await this.readUserFromDatastoreByCredentials(username, password);
        } catch (e) {
            Logger.debug(`Fails with the following error:`, e);
            return {
                isValid: false,
                message: e
            };
        }
    }

    public async getUserByUserId(userId: string): Promise<Validation<User>> {
        try {
            Logger.debug(`Gets user by its id: ${userId}`);
            const userCollection = await this.getUserCollectionFromDatastore('id', userId);
            return { isValid: true, message: 'Successful', result: userCollection[userId] };
        } catch (e) {
            Logger.debug(`Fails with the following error:`, e);
            return {
                isValid: false,
                message: e
            };
        }
    }

    public async hasUser(username: string): Promise<boolean> {
        const answer = await this.datastore.exists<User>('user', 'username', username);
        return answer.exists;
    }

    public getAllUsers(): User[] {
        return Array.from(this.userCollection.values());
    }

    private isPasswordCorrect(input: string, toCompare: string): boolean {
        return this.hashingHandler.isEquals(input, toCompare);
    }

    private async readUserFromDatastoreByCredentials(username: string, password: string): Promise<Validation<any>> {
        const userObj = await this.getUserCollectionFromDatastore('username', username);
        Logger.debug('User object from datastore: ', userObj);
        if (Object.keys(userObj).length > 1) {
            throw new Error('Multiple users with same credentials!');
        }
        const user: User = new User(userObj[Object.keys(userObj)[0]]);
        if (!user) {
            throw new Error('Username or password is incorrect!');
        }
        if (!user.is_active) {
            throw new Error('The account is deactivated.');
        }
        if (!this.isPasswordCorrect(password, user.password)) {
            throw new Error('Username or password is incorrect!');
        }
        return { isValid: true, message: 'successful', result: user };
    }

    private async getUserCollectionFromDatastore(property: keyof User, value: string): Promise<GetManyAnswer<User>> {
        if (!value) {
            Logger.error(`Property ${property} is ${value}`);
            throw new Error(`Property ${property} is ${value}`);
        }
        return await this.datastore.filter<User>('user', property, value, ['username', 'password', 'id', 'is_active']);
    }
}
