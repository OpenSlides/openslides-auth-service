import { Constructable } from '../../util/di';
import { HttpHandler, HttpHeaders, HttpMethod } from '../interfaces/http-handler';

@Constructable(HttpHandler)
export class HttpService extends HttpHandler {
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
