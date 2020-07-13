export enum HttpProtocol {
    HTTPS = 'https',
    HTTP = 'http'
}

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    DELETE = 'DELETE'
}

export interface HttpHeaders {
    [key: string]: string;
}

export abstract class HttpHandler {
    public static readonly DEFAULT_HEADERS: HttpHeaders = {
        accept: 'application/json',
        'Content-Type': 'application/json'
    };

    public abstract async get(url: string, data?: any, headers?: HttpHeaders, responseType?: string): Promise<any>;
    public abstract async post(url: string, data?: any, headers?: HttpHeaders): Promise<any>;
    public abstract async delete(url: string, data?: any, headers?: HttpHeaders): Promise<any>;
}
