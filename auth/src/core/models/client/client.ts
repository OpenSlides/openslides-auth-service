import { BaseModel } from '../../../core/base/base-model';

export default class Client extends BaseModel implements IClient {
    public static readonly COLLECTIONSTRING = 'client';

    public readonly username: string;
    public readonly password: string;
    public readonly clientId: string;
    private pSessionId: string;

    public get sessionId(): string {
        return this.pSessionId;
    }

    public constructor(input?: any) {
        super(Client.COLLECTIONSTRING, input);
    }

    public setSession(sessionId: string): void {
        this.pSessionId = sessionId;
    }
}

export interface IClient {
    sessionId: string;
}
