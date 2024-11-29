import { BaseJwt } from './base-jwt';
import { Id } from '../key-transforms';

export class Token extends BaseJwt {
    public readonly otherUserId: Id;
}
