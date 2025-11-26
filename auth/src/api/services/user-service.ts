import { Factory } from 'final-di';
import { Id } from 'src/core/key-transforms';

import { HashingService } from './hashing-service';
import { Logger } from './logger';
import { DatabaseAdapter } from '../../adapter/database-adapter';
import { AuthenticationException } from '../../core/exceptions/authentication-exception';
import { User } from '../../core/models/user';
import { Database, EventType, GetManyAnswer } from '../interfaces/database';
import { HashingHandler } from '../interfaces/hashing-handler';
import { UserHandler } from '../interfaces/user-handler';

const userFields: (keyof User)[] = ['id', 'username', 'password', 'is_active', 'saml_id'];
const dummyPassword =
    '$argon2id$v=19$m=65536,t=3,p=4$IGvN2jGNrF5aPB5G85671w$zdaAc/BrqhD7edEz5bJroJ+M9xeZrUWao34lY8494cM';

export class UserService implements UserHandler {
    @Factory(DatabaseAdapter)
    private readonly _database: Database;

    @Factory(HashingService)
    private readonly _hashingHandler: HashingHandler;

    public async getUserByCredentials(username: string, password: string): Promise<User> {
        Logger.debug(`Get user by credentials: ${username} and ${password}`);
        return await this.readUserFromDatabaseByCredentials(username, password);
    }

    public async getUserByUserId(userId: Id): Promise<User> {
        Logger.debug(`Get user by user id: ${userId}`);
        return await this._database.get<User>('user', userId, userFields);
    }

    public async getUserBySamlId(samlId: string): Promise<User> {
        const userObj = await this.getUserCollectionFromDatabase('saml_id', samlId);
        Logger.debug('User object by saml_id from datastore: ', userObj);

        const users = Object.values(userObj);
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
        const userObj = await this.getUserCollectionFromDatabase('username', username);
        Logger.debug('User object by username from database: ', userObj);

        const users = Object.values(userObj);
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
        await this._database.write({
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

    private async readUserFromDatabaseByCredentials(username: string, password: string): Promise<User> {
        const userObj = await this.getUserCollectionFromDatabase('username', username);
        Logger.debug('User object from database: ', userObj);
        const users = Object.values(userObj);
        if (users.length > 1) {
            Logger.error('Multiple users found for same username!');
            throw new AuthenticationException('Multiple users with same credentials!');
        }
        const thisUser: User = new User(users[0]);
        const passwordCorrect = await this.isPasswordCorrect(password, thisUser?.password || dummyPassword);
        if (!thisUser.isExisting() || !passwordCorrect) {
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

    private async getUserCollectionFromDatabase(property: keyof User, value: string): Promise<GetManyAnswer<User>> {
        if (!value) {
            Logger.error(`Property ${property} is ${value}`);
            throw new Error(`Property ${property} is ${value}`);
        }
        return await this._database.filter<User>('user', property, value, userFields);
    }
}
