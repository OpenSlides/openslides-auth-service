import { BaseModel } from '../../base/base-model';

export class User extends BaseModel implements IUser {
    public static readonly COLLECTIONSTRING = 'user';

    public readonly username: string;
    public readonly password: string;
    public readonly userId: string;
    private pSessionId: string;

    public get sessionId(): string {
        return this.pSessionId;
    }

    public constructor(input?: any) {
        super(User.COLLECTIONSTRING, input);
    }

    public setSession(sessionId: string): void {
        this.pSessionId = sessionId;
    }
}

export interface IUser {
    sessionId: string;
}
