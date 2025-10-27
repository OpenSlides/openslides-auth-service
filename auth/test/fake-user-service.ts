import jwt from 'jsonwebtoken';

import { HashingService } from '../src/api/services/hashing-service';
import { SecretService } from '../src/api/services/secret-service';
import { Fqid, getIdFromFqid, Id } from '../src/core/key-transforms';
import { User } from '../src/core/models/user';
import { FakeUser } from './fake-user';
import { TokenPayload, Utils } from './utils';
import { FakeDatabaseAdapter } from './fake-database-adapter';
import { EventType } from '../src/api/interfaces/database';

let nextUserId = 0;

export class FakeUserService {
    public get currentAdminId(): Id {
        return getIdFromFqid(this._adminFqid);
    }

    private get tokenKey(): string {
        return this._keyService.getTokenSecret();
    }

    private _fakeUser: FakeUser = new FakeUser();

    private _adminFqid: Fqid;

    private readonly _hashService = new HashingService();
    private readonly _keyService = new SecretService();

    public constructor(private readonly _database: FakeDatabaseAdapter) {}

    public getFakeUser(): FakeUser {
        return this._fakeUser;
    }

    public unsetAccessTokenInFakeUser(): void {
        this._fakeUser.accessToken = '';
    }

    public async init(): Promise<void> {
        await this._database.isReady();
        await this._database.prune();
        await this.createAdmin();
    }

    public async end(): Promise<void> {
        await this._database.closeConnection();
    }

    public async updateAdmin(fields: { [K in keyof User]?: unknown }): Promise<void> {
        await this.updateUser(this._adminFqid, fields);
    }

    public async createAdmin(): Promise<void> {
        const { username, password } = Utils.credentials;
        this._adminFqid = await this.createUser(username, { password });
    }

    public async createUser(username: string, options: { [K in keyof User]?: unknown } = {}): Promise<Fqid> {
        const fqid: Fqid = `user/1`;//${++nextUserId}`;
        const update = { ...options };
        if (update.password && typeof update.password === 'string') {
            update.password = await this._hashService.hash(update.password);
        } else {
            update.password = await this._hashService.hash(username);
        }
        await this._database.write([
            {
                type: EventType.CREATE,
                fqid,
                fields: { id: 1, username: username, is_active: true, ...update }
            }
        ]);
        return fqid;
    }

    public async updateUser(fqid: Fqid, options: { [K in keyof User]?: unknown }): Promise<void> {
        const update = { ...options };
        if (options.password && typeof options.password === 'string') {
            update.password = this._hashService.hash(options.password);
        }
        await this._database.write([
            {
                type: EventType.UPDATE,
                fqid,
                fields: { ...update }
            }
        ]);
    }

    // public async deleteUser(fqid: Fqid): Promise<void> {
    //     await this._database.write([{ type: EventType.DELETE, fqid }]);
    // }

    public async getUser(id: Id): Promise<User> {
        return await this._database.get<User>('user', id);
    }

    public setAccessTokenToExpired(): void {
        const oldAccessToken = this._fakeUser.accessToken.slice(7);
        const token = jwt.decode(oldAccessToken) as TokenPayload;
        const expiredAccessToken = jwt.sign(
            { exp: new Date(0).getTime(), sessionId: token.sessionId, userId: 1 },
            this.tokenKey,
            {
                algorithm: 'HS256'
            }
        );
        this._fakeUser.accessToken = `bearer ${expiredAccessToken}`;
    }

    public removeACharacterFromAccessTokenInFakeUser(): void {
        const accessToken = this._fakeUser.accessToken;
        const index = Math.round(Math.random() * accessToken.length);
        const nextToken = `${accessToken.substring(0, index)}${accessToken.substring(index + 1)}`;
        this._fakeUser.accessToken = nextToken;
    }

    public manipulateAccessTokenInFakeUser(): void {
        const accessToken = this._fakeUser.accessToken;
        const index = Math.round(Math.random() * accessToken.length);
        const nextToken = `${accessToken.substring(0, index)}/${accessToken.substring(index + 1)}`;
        this._fakeUser.accessToken = nextToken;
    }
}
