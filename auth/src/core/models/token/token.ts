import { User } from '../user/user';

export default interface Token {
    sessionId: string;
    userId: string;
    user: User;
}
