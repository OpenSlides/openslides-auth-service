import axios from 'axios';

import { InjectableClass } from '../../util/di';

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

export abstract class HttpHandler extends InjectableClass {
    public static readonly DEFAULT_HEADERS: HttpHeaders = {
        accept: 'application/json',
        'Content-Type': 'application/json'
    };

    public name = 'HttpHandler';

    protected async send<T>(
        url: string,
        method: HttpMethod,
        data?: { [key: string]: any },
        headers: HttpHeaders = {},
        responseType: string = 'json'
    ): Promise<any> {
        return new Promise(async (resolve, reject) => {
            axios({ url, method, data, headers })
                .then(answer => resolve(answer.data))
                .catch(error => reject(error));
        });
    }

    public abstract async get(url: string, data?: any, headers?: HttpHeaders, responseType?: string): Promise<any>;
    public abstract async post(url: string, data?: any, headers?: HttpHeaders): Promise<any>;
    public abstract async delete(url: string, data?: any, headers?: HttpHeaders): Promise<any>;
}
