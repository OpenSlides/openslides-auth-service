import axios from 'axios';

import { HttpHandler, HttpHeaders, HttpMethod } from '../interfaces/http-handler';

export class HttpService extends HttpHandler {
    private async send<T>(
        url: string,
        method: HttpMethod,
        data?: { [key: string]: any },
        headers: HttpHeaders = {},
        responseType: string = 'json'
    ): Promise<T> {
        return new Promise(async (resolve, reject) => {
            axios({ url, method, data, headers })
                .then(answer => resolve(answer.data))
                .catch(error => reject(error));
        });
    }

    public async get(url: string, data?: any, headers?: HttpHeaders, responseType?: string): Promise<any> {
        return this.send(url, HttpMethod.GET, headers, data, responseType);
    }
    public async post(url: string, data?: any, headers?: HttpHeaders): Promise<any> {
        return this.send(url, HttpMethod.POST, data, headers);
    }
    public async delete(url: string, data?: any, headers?: HttpHeaders): Promise<any> {
        return this.send(url, HttpMethod.DELETE, data, headers);
    }
}
