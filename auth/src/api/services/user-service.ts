import { Factory } from 'final-di';
import { Id } from 'src/core/key-transforms';

import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { User } from '../../core/models/user';
import { Datastore, EventType, GetManyAnswer } from '../interfaces/datastore';
import { HashingHandler } from '../interfaces/hashing-handler';
import { UserHandler } from '../interfaces/user-handler';
import { HashingService } from './hashing-service';
import { Logger } from './logger';

const userFields: (keyof User)[] = ['id', 'username', 'password', 'is_active', 'meta_deleted'];

export class UserService implements UserHandler {
    @Factory(DatastoreAdapter)
    private readonly _datastore: Datastore;

    @Factory(HashingService)
    private readonly _hashingHandler: HashingHandler;

    public async getUserByCredentials(username: string, password: string): Promise<User> {
        Logger.debug(`Get user by credentials: ${username} and ${password}`);
        return await this.readUserFromDatastoreByCredentials(username, password);
    }

    public async getUserByUserId(userId: Id): Promise<User> {
        Logger.debug(`Get user by user id: ${userId}`);
        return await this._datastore.get<User>('user', userId, userFields);
    }

    public async getUserByUsername(username: string): Promise<User> {
        const userObj = await this.getUserCollectionFromDatastore('username', username);
        Logger.debug('User object by username from datastore: ', userObj);

        const users = Object.values(userObj).filter(user => !user.meta_deleted);
        if (users.length > 1) {
            Logger.error('Multiple users found for same username!');
            throw new AuthenticationException('Multiple users with same credentials!');
        }
        const thisUser: User = new User(users[0]);
        if (!thisUser.isExisting()) {
            throw new AuthenticationException('Username is incorrect.');
        }
        if (!thisUser.is_active) {
            throw new AuthenticationException('The account is deactivated.');
        }
        return thisUser;
    }

    public async updateLastLogin(userId: Id): Promise<void> {
        Logger.debug(`Update last login for user ${userId}`);
        await this._datastore.write({
            user_id: userId,
            information: {},
            locked_fields: {},
            events: [
                {
                    type: EventType.UPDATE,
                    fqid: `user/${userId}`,
                    fields: { last_login: Math.floor(Date.now() / 1000) }
                }
            ]
        });
    }

    private isPasswordCorrect(input: string, toCompare: string): boolean {
        return this._hashingHandler.isEquals(input, toCompare);
    }

    private async readUserFromDatastoreByCredentials(username: string, password: string): Promise<User> {
        const userObj = await this.getUserCollectionFromDatastore('username', username);
        Logger.debug('User object from datastore: ', userObj);
        const users = Object.values(userObj).filter(user => !user.meta_deleted);
        if (users.length > 1) {
            Logger.error('Multiple users found for same username!');
            throw new AuthenticationException('Multiple users with same credentials!');
        }
        const thisUser: User = new User(users[0]);
        if (!thisUser.isExisting() || !this.isPasswordCorrect(password, thisUser.password)) {
            throw new AuthenticationException('Username or password is incorrect.');
        }
        if (!thisUser.is_active) {
            throw new AuthenticationException('The account is deactivated.');
        }
        return thisUser;
    }

    private async getUserCollectionFromDatastore(property: keyof User, value: string): Promise<GetManyAnswer<User>> {
        if (!value) {
            Logger.error(`Property ${property} is ${value}`);
            throw new Error(`Property ${property} is ${value}`);
        }
        return await this._datastore.filter<User>('user', property, value, userFields);
    }
}
