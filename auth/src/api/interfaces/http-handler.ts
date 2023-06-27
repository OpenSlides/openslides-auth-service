export enum HttpProtocol {
    HTTPS = 'https',
    HTTP = 'http'
}

export enum HttpMethod {
    GET = 'get',
    POST = 'post'
}

export interface HttpHeaders {
    [key: string]: string | string[];
}

export interface HttpData {
    [key: string]: unknown;
}

export type HttpResponse<T = unknown> = T & {
    status: number;
    headers: HttpHeaders;
    cookies: { [cookieName: string]: string };
    message?: string;
    data?: T;
    success?: boolean;
};

export interface HttpRequestOptions {
    observe?: 'response' | 'data' | 'all';
}

export abstract class HttpHandler {
    public static readonly DEFAULT_HEADERS: HttpHeaders = {
        accept: 'application/json',
        'Content-Type': 'application/json'
    };

    public abstract get<T>(
        url: string,
        data?: HttpData,
        headers?: HttpHeaders,
        options?: HttpRequestOptions
    ): Promise<HttpResponse<T> | T>;
    public abstract post<T>(
        url: string,
        data?: HttpData | unknown,
        headers?: HttpHeaders,
        options?: HttpRequestOptions
    ): Promise<HttpResponse<T> | T>;
    public abstract send<T>(
        url: string,
        method: HttpMethod,
        data?: HttpData,
        headers?: HttpHeaders,
        options?: HttpRequestOptions
    ): Promise<HttpResponse<T> | T>;
}
