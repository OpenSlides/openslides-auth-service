import { BaseModel } from '../../base/base-model';

export class User extends BaseModel implements IUser {
    public static readonly COLLECTIONSTRING = 'user';

    public readonly username: string;
    public readonly password: string;
    public readonly userId: string;

    private sessionId: string;

    public constructor(input?: any) {
        super(User.COLLECTIONSTRING, input);
    }

    public setSession(sessionId: string): void {
        this.sessionId = sessionId;
    }

    public hasSessionId(sessionId: string): boolean {
        return this.sessionId === sessionId;
    }
}

export interface IUser {
    hasSessionId: (sessionId: string) => boolean;
}
