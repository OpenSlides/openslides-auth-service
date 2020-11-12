export class User {
    public static readonly COLLECTION = 'user';

    public readonly username: string;
    public readonly password: string;
    public readonly id: string;
    public readonly is_active: boolean;

    public constructor(input?: any) {
        Object.assign(this, input);
    }
}
