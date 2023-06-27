import { Id } from '../key-transforms';

export class User {
    public static readonly COLLECTION = 'user';

    public readonly id: Id;
    public readonly saml_id: string;
    public readonly username: string;
    public readonly password: string;
    public readonly email: string;
    public readonly last_login: number;
    public readonly is_active: boolean;
    public readonly meta_deleted: boolean;

    public constructor(input?: Partial<User>) {
        Object.assign(this, input);
    }

    public isExisting(): boolean {
        return !!Object.keys(this).length;
    }
}
