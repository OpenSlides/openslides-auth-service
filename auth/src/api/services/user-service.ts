import { Factory } from 'final-di';

import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { User } from '../../core/models/user';
import { Datastore, GetManyAnswer } from '../interfaces/datastore';
import { HashingHandler } from '../interfaces/hashing-handler';
import { UserHandler } from '../interfaces/user-handler';
import { HashingService } from './hashing-service';
import { Logger } from './logger';

export class UserService implements UserHandler {
    @Factory(DatastoreAdapter)
    private readonly _datastore: Datastore;

    @Factory(HashingService)
    private readonly _hashingHandler: HashingHandler;

    private readonly _userCollection: Map<string, User> = new Map();

    public async getUserByCredentials(username: string, password: string): Promise<User> {
        Logger.debug(`Get user by credentials: ${username} and ${password}`);
        return await this.readUserFromDatastoreByCredentials(username, password);
    }

    public async getUserByUserId(userId: string): Promise<User> {
        Logger.debug(`Get user by user id: ${userId}`);
        const userCollection = await this.getUserCollectionFromDatastore('id', userId);
        return userCollection[userId];
    }

    public async hasUser(username: string): Promise<boolean> {
        const answer = await this._datastore.exists<User>('user', 'username', username);
        return answer.exists;
    }

    public getAllUsers(): User[] {
        return Array.from(this._userCollection.values());
    }

    private isPasswordCorrect(input: string, toCompare: string): boolean {
        return this._hashingHandler.isEquals(input, toCompare);
    }

    private async readUserFromDatastoreByCredentials(username: string, password: string): Promise<User> {
        const userObj = await this.getUserCollectionFromDatastore('username', username);
        Logger.debug('User object from datastore: ', userObj);
        if (Object.keys(userObj).length > 1) {
            Logger.error('Multiple users found for same username!');
            throw new AuthenticationException('Multiple users with same credentials!');
        }
        const user: User = new User(userObj[Object.keys(userObj)[0]]);
        if (!user.isExisting() || !this.isPasswordCorrect(password, user.password)) {
            throw new AuthenticationException('Username or password is incorrect.');
        }
        if (!user.is_active) {
            throw new AuthenticationException('The account is deactivated.');
        }
        return user;
    }

    private async getUserCollectionFromDatastore(property: keyof User, value: string): Promise<GetManyAnswer<User>> {
        if (!value) {
            Logger.error(`Property ${property} is ${value}`);
            throw new Error(`Property ${property} is ${value}`);
        }
        return await this._datastore.filter<User>('user', property, value, ['username', 'password', 'id', 'is_active']);
    }
}
