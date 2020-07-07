export class User implements IUser {
    public static readonly COLLECTION = 'user';

    public readonly username: string;
    public readonly password: string;
    public readonly id: string;

    public get sessionId(): string {
        return this.pSessionId;
    }

    private pSessionId: string;

    public constructor(input?: any) {
        Object.assign(this, input);
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
