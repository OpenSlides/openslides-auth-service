export enum HttpProtocol {
    HTTPS = 'https',
    HTTP = 'http'
}

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST'
}

export interface HttpHeaders {
    [key: string]: string | string[];
}

export interface HttpData {
    [key: string]: any;
}

export interface HttpResponse<T = any> {
    [key: string]: any;
    status: number;
    headers: HttpHeaders;
    message?: string;
    cookies: { [cookieName: string]: string };
    data?: T;
}

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
        data?: HttpData,
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
