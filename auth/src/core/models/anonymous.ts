import { JwtPayload } from '../ticket/base-jwt';

export const anonymous: JwtPayload = {
    userId: 0,
    sessionId: '0'
};
