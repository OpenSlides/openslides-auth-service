import { HttpHandler, HttpHeaders, HttpMethod, HttpResponse } from '../src/api/interfaces/http-handler';
import { HttpService } from '../src/api/services/http-service';

export interface RequestOptions<D = any> {
    headers?: HttpHeaders;
    data?: D;
    usingCookies?: boolean;
    internal?: boolean;
}

const SERVER_URL = process.env.AUTH_URL || 'http://localhost:9004';
const EXTERNAL_URL = '/system/auth';
const INTERNAL_URL = '/internal/auth';

const DEFAULT_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

export class FakeHttpService {
    private http: HttpHandler = new HttpService();

    public async get<T = any, D = any>(url: string, options?: RequestOptions<D>): Promise<HttpResponse<T>> {
        return this.send(this.getExternalUrlToServer(url), HttpMethod.GET, options);
    }

    public async post<T = any, D = any>(url: string, options: RequestOptions<D> = {}): Promise<HttpResponse<T>> {
        if (options.internal) {
            return this.send(this.getInternalUrlToServer(url), HttpMethod.POST, options);
        } else {
            return this.send(this.getExternalUrlToServer(url), HttpMethod.POST, options);
        }
    }

    public async send<T = any, D = any>(
        url: string,
        method: HttpMethod,
        { data, headers = {} }: RequestOptions<D> = {}
    ): Promise<HttpResponse<T>> {
        headers = { ...DEFAULT_HEADERS, ...headers };
        return (await this.http.send(url, method, data as any, headers)) as HttpResponse<T>;
    }

    private formatUrl(path: string): string {
        if (!path.startsWith('/')) {
            path = `/${path}`;
        }
        return path;
    }

    private getExternalUrlToServer(path: string): string {
        const url = this.formatUrl(path);
        return `${SERVER_URL}${EXTERNAL_URL}${url}`;
    }

    private getInternalUrlToServer(path: string): string {
        const url = this.formatUrl(path);
        return `${SERVER_URL}${INTERNAL_URL}${url}`;
    }
}
