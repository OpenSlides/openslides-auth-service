import { User } from '../models/user';

export interface Ticket {
    cookie: string;
    token: string;
    user: User;
}
