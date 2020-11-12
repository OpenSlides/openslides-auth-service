import jwt from 'jsonwebtoken';

import { FakeUser } from './fake-user';
import { KeyService } from '../src/api/services/key-service';
import { Utils } from './utils';

export class FakeUserService {
    private static instance: FakeUserService;

    private fakeUser: FakeUser = new FakeUser();

    private readonly keyService = new KeyService();

    private get tokenKey(): string {
        return this.keyService.getTokenKey();
    }

    private constructor() {}

    public static getInstance(): FakeUserService {
        if (!this.instance) {
            this.instance = new FakeUserService();
        }
        return this.instance;
    }

    public getFakeUser(): FakeUser {
        return this.fakeUser;
    }

    public unsetAccessTokenInFakeUser(): void {
        this.fakeUser.accessToken = '';
    }

    public setAccessTokenToExpired(): void {
        const oldAccessToken = this.fakeUser.accessToken.slice(7);
        const token = jwt.decode(oldAccessToken) as Utils.TokenPayload;
        const expiredAccessToken = jwt.sign(
            { exp: new Date(0).getTime(), sessionId: token.sessionId, userId: 1 },
            this.tokenKey,
            {
                algorithm: 'HS256'
            }
        );
        this.fakeUser.accessToken = `bearer ${expiredAccessToken}`;
    }

    public removeACharacterFromAccessTokenInFakeUser(): void {
        const accessToken = this.fakeUser.accessToken;
        const index = Math.round(Math.random() * accessToken.length);
        const nextToken = `${accessToken.substring(0, index)}${accessToken.substring(index + 1)}`;
        this.fakeUser.accessToken = nextToken;
    }

    public manipulateAccessTokenInFakeUser(): void {
        const accessToken = this.fakeUser.accessToken;
        const index = Math.round(Math.random() * accessToken.length);
        const nextToken = `${accessToken.substring(0, index)}/${accessToken.substring(index + 1)}`;
        this.fakeUser.accessToken = nextToken;
    }
}
