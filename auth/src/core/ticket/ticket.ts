import { User } from '../models/user/user';

export interface Ticket {
    cookie: string;
    token: string;
    user: User;
}
