import { AxiosError } from 'axios';

import { HttpResponse } from '../src/api/interfaces/http-handler';

export interface SessionInformation {
    userId: number;
    sessionId: string;
}

export interface TokenPayload extends SessionInformation {
    iat: number;
    exp: number;
}

export class Utils {
    public static readonly credentials = { username: 'admin', password: 'admin' };

    public static readonly deprecatedPasswordHash = '316af7b2ddc20ead599c38541fbe87e9a9e4e960d4017d6e59de188b41b2758flD5BVZAZ8jLy4nYW9iomHcnkXWkfk3PgBjeiTSxjGG7+fBjMBxsaS1vIiAMxYh+K38l0gDW4wcP+i8tgoc4UBg==';

    public static isAxiosError(payload: any): payload is AxiosError {
        return !!payload.isAxiosError && payload.isAxiosError;
    }

    public static decodeBase64<V>(encodedString: string): V {
        const buffer = Buffer.from(encodedString, 'base64');
        return JSON.parse(buffer.toString());
    }

    public static getSessionInformationFromUser(user: HttpResponse): SessionInformation {
        const tokenParts = (user.headers.authentication as string).split('.');
        return Utils.decodeBase64<SessionInformation>(tokenParts[1]);
    }
}
