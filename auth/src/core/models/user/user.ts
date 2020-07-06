import { BaseModel } from '../../base/base-model';

export class User extends BaseModel implements IUser {
    public static readonly COLLECTION = 'user';

    public readonly username: string;
    public readonly password: string;
    public readonly userId: string;

    public get sessionId(): string {
        return this.pSessionId;
    }

    private pSessionId: string;

    public constructor(input?: any) {
        super(User.COLLECTION, input);
    }

    public setSession(sessionId: string): void {
        this.pSessionId = sessionId;
    }

    public hasSessionId(sessionId: string): boolean {
        return this.pSessionId === sessionId;
    }
}

export interface IUser {
    hasSessionId: (sessionId: string) => boolean;
}
