import { FakeUserService } from './fake-user-service';
import { HttpService } from '../src/api/services/http-service';
import { HttpHandler, HttpHeaders, HttpMethod, HttpResponse } from '../src/api/interfaces/http-handler';

interface RequestOptions {
    headers?: HttpHeaders;
    data?: any;
    usingCookies?: boolean;
    internal?: boolean;
}

const SERVER_URL = process.env.AUTH_URL || 'http://localhost:9004';
const EXTERNAL_URL = '/system/auth';
const INTERNAL_URL = '/internal/auth';

const DEFAULT_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

export class FakeHttpService {
    private static http: HttpHandler = new HttpService();

    public static async get<T = any>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
        return this.send(this.getExternalUrlToServer(url), HttpMethod.GET, options);
    }

    public static async post<T = any>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
        if (options.internal) {
            return this.send(this.getInternalUrlToServer(url), HttpMethod.POST, options);
        } else {
            return this.send(this.getExternalUrlToServer(url), HttpMethod.POST, options);
        }
    }

    public static async send<T = any>(
        url: string,
        method: HttpMethod,
        { data, headers = {}, usingCookies = true }: RequestOptions = {}
    ): Promise<HttpResponse<T>> {
        const fakeUser = FakeUserService.getInstance().getFakeUser();
        headers = { authentication: fakeUser.accessToken, ...DEFAULT_HEADERS, ...headers };
        if (usingCookies) {
            headers['cookie'] = `refreshId=${fakeUser.refreshId}`;
        }
        return (await this.http.send(url, method, data, headers)) as HttpResponse<T>;
    }

    private static formatUrl(path: string): string {
        if (!path.startsWith('/')) {
            path = `/${path}`;
        }
        return path;
    }

    private static getExternalUrlToServer(path: string): string {
        const url = this.formatUrl(path);
        return `${SERVER_URL}${EXTERNAL_URL}${url}`;
    }

    private static getInternalUrlToServer(path: string): string {
        const url = this.formatUrl(path);
        return `${SERVER_URL}${INTERNAL_URL}${url}`;
    }
}
