export class User implements IUser {
    public static readonly COLLECTION = 'user';

    public readonly username: string;
    public readonly password: string;
    public readonly default_password: string;
    public readonly id: string;

    public get sessions(): string[] {
        return this._sessions;
    }

    private _sessions: string[] = [];

    public constructor(input?: any) {
        Object.assign(this, input);
    }

    public addSession(session: string): void {
        this._sessions.push(session);
    }

    public hasSessionId(sessionId: string): boolean {
        return this._sessions.some(session => session === sessionId);
    }
}

export interface IUser {
    hasSessionId: (sessionId: string) => boolean;
}
