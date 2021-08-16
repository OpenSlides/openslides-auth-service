import { AxiosError } from 'axios';

import { FakeRequest } from './fake-request';
import { FakeHttpService } from './fake-http-service';
import { HttpResponse } from '../src/api/interfaces/http-handler';

export namespace Utils {
    export const credentials = { username: 'admin', password: 'admin' };

    export interface SessionInformation {
        userId: number;
        sessionId: string;
    }

    export interface TokenPayload extends SessionInformation {
        iat: number;
        exp: number;
    }

    export function isAxiosError(payload: any): payload is AxiosError {
        return !!payload.isAxiosError && payload.isAxiosError;
    }

    export function decodeBase64<V>(encodedString: string): V {
        const buffer = Buffer.from(encodedString, 'base64');
        return JSON.parse(buffer.toString());
    }

    export function getSessionInformationFromUser(user: HttpResponse): SessionInformation {
        const tokenParts = (user.headers.authentication as string).split('.');
        return decodeBase64<SessionInformation>(tokenParts[1]);
    }

    export async function getNSessions(n: number): Promise<SessionInformation[]> {
        const sessions = [];
        for (let i = 0; i < n; ++i) {
            const response = await FakeRequest.login();
            sessions.push(getSessionInformationFromUser(response));
        }
        return sessions;
    }

    export async function getAllActiveSessions(): Promise<string[]> {
        const activeSessions = await FakeHttpService.get('secure/list-sessions');
        return activeSessions.sessions;
    }
}
