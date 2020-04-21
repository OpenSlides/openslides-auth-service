import { BaseModel } from '../../../core/base/base-model';

export default class Client extends BaseModel implements IClient {
    public static readonly COLLECTIONSTRING = 'client';
    // public readonly collectionString = 'client';

    public readonly username: string;
    public readonly password: string;
    // public readonly sessionId: string
    public readonly clientId: string;
    // private pClientId: string;
    // private pClientSecret: string;
    // private pUsername: string;
    // private pPassword: string;
    private pSessionId: string;

    public get sessionId(): string {
        return this.pSessionId;
    }

    // public get username(): string {
    //     console.log('username', this.pUsername);
    //     return this.pUsername;
    // }

    // public get password(): string {
    //     return this.pPassword;
    // }

    // public get clientId(): string {
    //     return this.pClientId;
    // }
    // public get clientSecret(): string {
    //     return this.pClientSecret;
    // }

    public constructor(input?: any) {
        // this.pUsername = username;
        // this.pPassword = password;
        // this.pClientId = clientId;
        super(Client.COLLECTIONSTRING, input);
        console.log('input', input);
        // this.username = username;
        // this.password = password;
        // this.clientId = clientId;
    }

    public setSession(sessionId: string): void {
        this.pSessionId = sessionId;
        // this.sessionId = sessionId
    }
}

export interface IClient {
    sessionId: string;
}
