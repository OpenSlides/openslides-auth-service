export default class Client {
    private pClientId: string;
    private pClientSecret: string;
    private pUsername: string;
    private pPassword: string;

    public get username(): string {
        return this.pUsername;
    }

    public get password(): string {
        return this.pPassword;
    }

    public get clientId(): string {
        return this.pClientId;
    }
    public get clientSecret(): string {
        return this.pClientSecret;
    }
    // private redirectUris: string[];
    // private scope: string;
}

export interface IClient {
    sessionId: string;
}
