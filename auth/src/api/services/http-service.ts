import axios, { AxiosError, AxiosResponse } from 'axios';

import { HttpHandler, HttpHeaders, HttpMethod, HttpResponse, HttpRequestOptions } from '../interfaces/http-handler';
import { Logger } from './logger';

export interface HttpData {
    [key: string]: unknown;
}

export class HttpService extends HttpHandler {
    public async get<T>(url: string, data?: HttpData, headers?: HttpHeaders): Promise<HttpResponse<T> | T> {
        return this.send<T>(url, HttpMethod.GET, data, headers);
    }
    public async post<T>(url: string, data?: HttpData | unknown, headers?: HttpHeaders): Promise<HttpResponse<T> | T> {
        return this.send<T>(url, HttpMethod.POST, data, headers);
    }
    public async send<T>(
        url: string,
        method: HttpMethod,
        data?: HttpData | unknown,
        headers: HttpHeaders = {},
        { observe }: HttpRequestOptions = {}
    ): Promise<HttpResponse<T> | T> {
        Logger.debug(`Sending a request: ${method} ${url} ${JSON.stringify(data)} ${JSON.stringify(headers)}`);
        try {
            const response = await axios({ url, method, data, headers, responseType: 'json' });
            return this.createHttpResponse<T>(response, observe);
        } catch (e) {
            this.handleError(e as AxiosError, url, method, data, headers);
            return this.createHttpResponse<T>((e as AxiosError).response as AxiosResponse, observe);
        }
    }

    private handleError(
        error: AxiosError,
        url: string,
        method: HttpMethod,
        data?: HttpData | unknown,
        headers?: HttpHeaders
    ): void {
        Logger.error('HTTP-error occurred: ', error.message, '; response data: ', JSON.stringify(error.response?.data));
        Logger.error(`Error is occurred while sending the following information: ${method} ${url}`);
        Logger.error(
            `Request contains the following data ${JSON.stringify(data)} and headers ${JSON.stringify(headers)}`
        );
    }

    private createHttpResponse<T>(
        response: AxiosResponse<T>,
        observe: 'response' | 'data' | 'all' = 'all'
    ): HttpResponse<T> | T {
        const result = {
            status: response.status,
            headers: response.headers as HttpHeaders,
            cookies: this.getCookiesByHeaders(response.headers)
        };
        if (observe === 'response') {
            return {
                ...result,
                data: response.data
            } as HttpResponse<T>;
        }
        if (observe === 'data') {
            return response.data;
        }
        return {
            ...result,
            ...response.data
        };
    }

    private getCookiesByHeaders(headers: HttpHeaders): { [cookieName: string]: string } {
        const parseCookie = (rawCookie: string): [string, string] => {
            const indexOfEqual = rawCookie.indexOf('=');
            const parts = [rawCookie.slice(0, indexOfEqual), rawCookie.slice(indexOfEqual + 1)];
            const pathIndex = parts[1].search(/Path=/i);
            return [parts[0], parts[1].slice(0, pathIndex - 2)];
        };
        const rawCookies = headers['set-cookie'] as string[];
        const cookies: { [cookieName: string]: string } = {};
        if (rawCookies && rawCookies.length) {
            for (const rawCookie of rawCookies) {
                const [cookieKey, cookieValue]: [string, string] = parseCookie(rawCookie);
                cookies[cookieKey] = cookieValue;
            }
        }
        return cookies;
    }
}
