import { FakeUser } from './fake-user';

export class FakeUserService {
    private static instance: FakeUserService;

    private fakeUser: FakeUser = new FakeUser();

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
        this.fakeUser.accessToken =
            'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
            'eyJleHBpcmVzSW4iOiIxMG0iLCJzZXNzaW9uSWQiOiI2NjUzYWMwNmJhNjVkYmQzNDE5NTQwOGQ1MDI5NjU1ZSIsIn' +
            'VzZXJJZCI6MSwiaWF0IjoxNTk3MTQ5NDI0LCJleHAiOjE1OTcxNTAwMjR9.' +
            'z21-bSIj_xZAoCbwXTqqf_ODAIEbbeSehYIE33dmYUs';
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
