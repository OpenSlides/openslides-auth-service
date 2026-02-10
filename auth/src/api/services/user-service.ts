import { Factory } from 'final-di';
import { Id } from 'src/core/key-transforms';

import { HashingService } from './hashing-service';
import { Logger } from './logger';
import { DatastoreAdapter } from '../../adapter/datastore-adapter';
import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { User } from '../../core/models/user';
import { Datastore, EventType, GetManyAnswer } from '../interfaces/datastore';
import { HashingHandler } from '../interfaces/hashing-handler';
import { UserHandler } from '../interfaces/user-handler';

const userFields: (keyof User)[] = ['id', 'username', 'password', 'is_active', 'meta_deleted', 'saml_id'];
const dummyPassword =
    '$argon2id$v=19$m=65536,t=3,p=4$OXRxaWhTU2JnNkFvdnBDRg$Hqd6Us8drdCsBo3gpYth0Q';

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

    public async getUserBySamlId(samlId: string): Promise<User> {
        const userObj = await this.getUserCollectionFromDatastore('saml_id', samlId);
        Logger.debug('User object by saml_id from datastore: ', userObj);

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
        await this.updateUser(userId, { last_login: Math.floor(Date.now() / 1000) });
    }

    private async updateUser(userId: Id, data: { [K in keyof User]?: unknown }): Promise<void> {
        Logger.debug(`Update user ${userId}: ` + JSON.stringify(data));
        await this._datastore.write({
            user_id: userId,
            information: {},
            locked_fields: {},
            events: [
                {
                    type: EventType.UPDATE,
                    fqid: `user/${userId}`,
                    fields: data
                }
            ]
        });
    }

    private async isPasswordCorrect(input: string, toCompare: string): Promise<boolean> {
        return await this._hashingHandler.isEquals(input, toCompare);
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
        const passwordCorrect = await this.isPasswordCorrect(password, thisUser.password || dummyPassword);
        if (!thisUser.password || !thisUser.isExisting() || !passwordCorrect) {
            throw new AuthenticationException('Username or password is incorrect.');
        }
        if (!thisUser.is_active) {
            throw new AuthenticationException('The account is deactivated.');
        }
        // migrate old passwords
        if (this._hashingHandler.isDeprecatedHash(thisUser.password)) {
            const newHash = await this._hashingHandler.hash(password);
            await this.updateUser(thisUser.id, { password: newHash });
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
