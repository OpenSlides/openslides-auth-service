import { BaseModel } from '../base/base-model';
import { Id } from '../key-transforms';

export class User extends BaseModel<User> {
    public static readonly COLLECTION = 'user';

    public readonly id: Id;

    public readonly saml_id: string;
    public readonly username: string;
    public readonly password: string;
    public readonly email: string;
    public readonly last_login: number;
    public readonly is_active: boolean;

    public constructor(input?: Partial<User>) {
        super(input);
    }

    public isExisting(): boolean {
        return !!Object.keys(this).length;
    }
}
