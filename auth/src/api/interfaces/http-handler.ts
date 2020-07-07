import axios from 'axios';
import http from 'http';
import https from 'https';

import { InjectableClass } from '../../util/di';
import { Logger } from '../services/logger';

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
        const protocol = url.startsWith('https') ? HttpProtocol.HTTPS : HttpProtocol.HTTP;
        // const arrayDomainPath = url.substr(protocol.length + 3).split('/');
        const domain = url.substr(0, url.indexOf('/', protocol.length + 3));
        const path = url.substr(url.indexOf('/', protocol.length + 3) + 1);
        console.log('url', url);
        // headers['accept'] = `application/${responseType}`;
        headers = Object.assign(headers, HttpHandler.DEFAULT_HEADERS);
        const options = {
            // hostname: 'localhost',
            // path: `/${path}`,
            // port: 9010,
            method,
            headers
        };
        console.log('data', data);
        console.log('options', options);

        // const req = http.request(url, options, res => {
        //     res.setEncoding('utf8');
        //     res.on('data', chunk => {
        //         console.log(`BODY: ${chunk}`);
        //     });
        //     res.on('end', () => {
        //         console.log('No more data in response.');
        //     });
        // });
        // req.write(JSON.stringify(data));
        // req.end();
        // return req;

        const result = await axios({
            url,
            method,
            data,
            headers: HttpHandler.DEFAULT_HEADERS
        });

        console.log('result', result.data);

        return new Promise(async (resolve, reject) => {
            axios({ url, method, data, headers })
                .then(answer => resolve(answer.data))
                .catch(error => reject(error));
        });

        // const promise = new Promise((resolve, reject) => {
        //     const request = http.
        // })
        // const req = request(method, url).send(data);
        // for (const header of headers) {
        //     req.set(header[0], header[1]);
        // }
        // req.set('Accept', `application/${responseType}`);
        // return req;

        // const o: any = null;
        // return o;
    }

    public abstract async get(url: string, data?: any, headers?: HttpHeaders, responseType?: string): Promise<any>;
    public abstract async post(url: string, data?: any, headers?: HttpHeaders): Promise<any>;
    public abstract async delete(url: string, data?: any, headers?: HttpHeaders): Promise<any>;
}
