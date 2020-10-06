import request from 'superagent';

import { FakeUserService } from './fake-user-service';

export namespace Utils {
    const SERVER_URL = process.env.AUTH_URL || 'http://localhost:9004';
    const EXTERNAL_URL = '/system/auth';
    const INTERNAL_URL = '/internal/auth';

    const fakeUserService = FakeUserService.getInstance();
    const fakeUser = fakeUserService.getFakeUser();

    const agent = request.agent();

    enum HttpMethod {
        POST = 'post',
        GET = 'get',
        DELETE = 'delete'
    }

    function formatUrl(path: string): string {
        if (!path.startsWith('/')) {
            path = `/${path}`;
        }
        return path;
    }

    function getExternalUrlToServer(path: string): string {
        const url = formatUrl(path);
        return `${SERVER_URL}${EXTERNAL_URL}${url}`;
    }

    function getInternalUrlToServer(path: string): string {
        const url = formatUrl(path);
        return `${SERVER_URL}${INTERNAL_URL}${url}`;
    }

    async function makeRequest(
        method: HttpMethod,
        url: string,
        data?: HttpData,
        headers: HttpHeaders = {}
    ): Promise<ServerResponse> {
        const response = await agent[method](url)
            .set({
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...{ authentication: fakeUser.accessToken, ...headers }
            })
            .withCredentials()
            .send(data);
        return sendResponse(response);
    }

    async function makeRequestWithoutCookies(
        method: HttpMethod,
        url: string,
        data?: HttpData,
        headers: HttpHeaders = {}
    ): Promise<ServerResponse> {
        const response = await request[method](url)
            .set({
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...{ authentication: fakeUser.accessToken, ...headers }
            })
            .send(data);
        return sendResponse(response);
    }

    function sendResponse(response: request.Response): ServerResponse {
        return { headers: response.header, ...response.body };
    }

    export const credentials = { username: 'admin', password: 'admin' };

    export const defaultResponse: ServerResponse = {
        headers: {},
        message: '',
        result: '',
        success: false
    };

    export interface HttpData {
        [key: string]: any;
    }

    export interface HttpHeaders {
        [key: string]: string;
    }

    export interface ServerResponse {
        headers: HttpHeaders;
        success: boolean;
        message: string;
        result: string;
        [key: string]: any;
    }

    export interface SessionInformation {
        userId: number;
        sessionId: string;
    }

    export interface TokenPayload extends SessionInformation {
        iat: number;
        exp: number;
    }

    export async function requestGet(path: string): Promise<ServerResponse> {
        const url = getExternalUrlToServer(path);
        return await makeRequest(HttpMethod.GET, url);
    }

    export async function requestInternalGet(path: string): Promise<ServerResponse> {
        const url = getInternalUrlToServer(path);
        return await makeRequest(HttpMethod.GET, url);
    }

    export async function requestPost(path: string, data?: HttpData, headers?: HttpHeaders): Promise<ServerResponse> {
        const url = getExternalUrlToServer(path);
        return await makeRequest(HttpMethod.POST, url, data, headers);
    }

    export async function requestInternalPost(
        path: string,
        data?: HttpData,
        headers?: HttpHeaders
    ): Promise<ServerResponse> {
        const url = getInternalUrlToServer(path);
        return await makeRequest(HttpMethod.POST, url, data, headers);
    }

    export async function requestPostWithoutCredentials(
        path: string,
        data?: HttpData,
        headers?: HttpHeaders
    ): Promise<ServerResponse> {
        const url = getExternalUrlToServer(path);
        return await makeRequestWithoutCookies(HttpMethod.POST, url, data, headers);
    }

    export async function requestInternalPostWithoutCookies(
        path: string,
        data?: HttpData,
        headers?: HttpHeaders
    ): Promise<ServerResponse> {
        const url = getInternalUrlToServer(path);
        return await makeRequestWithoutCookies(HttpMethod.POST, url, data, headers);
    }

    export async function requestDelete(path: string, data?: HttpData): Promise<ServerResponse> {
        const url = getExternalUrlToServer(path);
        return await makeRequest(HttpMethod.DELETE, url, data);
    }

    export function decodeBase64<V>(encodedString: string): V {
        const buffer = Buffer.from(encodedString, 'base64');
        return JSON.parse(buffer.toString());
    }

    export function getSessionInformationFromUser(user: ServerResponse): SessionInformation {
        const tokenParts = user.headers.authentication.split('.');
        return decodeBase64<SessionInformation>(tokenParts[1]);
    }
}
