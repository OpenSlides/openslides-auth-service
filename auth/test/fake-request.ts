import { HttpHeaders, HttpResponse, HttpMethod } from '../src/api/interfaces/http-handler';
import { FakeHttpService, RequestOptions } from './fake-http-service';
import { FakeUser } from './fake-user';
import { FakeUserService } from './fake-user-service';
import { SessionInformation, Utils } from './utils';
import { Validation } from './validation';
import { AuthHandler } from '../src/api/interfaces/auth-handler';

export class FakeRequest {
    private get fakeUser(): FakeUser {
        return this.userService.getFakeUser();
    }

    public constructor(private readonly userService: FakeUserService, private readonly httpService: FakeHttpService) {}

    public async login(username?: string, password?: string): Promise<HttpResponse> {
        const credentials = username || password ? { username, password } : Utils.credentials;
        return await this.httpService.post('login', { data: credentials }).then(response => {
            this.fakeUser.accessToken = response.headers.authentication as string;
            this.fakeUser.refreshId = response.cookies['refreshId'];
            return response;
        });
    }

    public async loginForNTimes(n: number): Promise<HttpResponse[]> {
        const response: HttpResponse[] = [];
        for (let i = 0; i < n; ++i) {
            response.push(await this.login());
        }
        return response;
    }

    public async getNSessions(n: number): Promise<SessionInformation[]> {
        const sessions: SessionInformation[] = [];
        for (let i = 0; i < n; ++i) {
            const response = await this.login();
            sessions.push(Utils.getSessionInformationFromUser(response));
        }
        return sessions;
    }

    public async getAllActiveSessions(): Promise<string[]> {
        const response = await this.get<{ sessions: string[] }>('secure/list-sessions');
        return response.sessions;
    }

    public async authenticate({ usingCookies = true }: { usingCookies?: boolean } = {}): Promise<
        HttpResponse<SessionInformation>
    > {
        return await this.send('authenticate', HttpMethod.POST, { internal: true, usingCookies });
    }

    public async post<T>(
        url: string,
        { data, usingCookies = true }: { data?: unknown; usingCookies?: boolean } = {}
    ): Promise<HttpResponse<T>> {
        return await this.send<T>(url, HttpMethod.POST, { data, usingCookies });
    }

    public async get<T>(
        url: string,
        { usingCookies = true }: { usingCookies?: boolean } = {}
    ): Promise<HttpResponse<T>> {
        return await this.send<T>(url, HttpMethod.GET, { usingCookies });
    }

    public async sendRequestAndValidateForbiddenRequest(request: Promise<any>): Promise<void> {
        this.handleError(await request);
    }

    public handleError(error: any): void {
        Validation.validateForbiddenRequest(error);
    }

    private async send<T>(url: string, method: HttpMethod, options: RequestOptions): Promise<HttpResponse<T>> {
        const headers: HttpHeaders = { [AuthHandler.AUTHENTICATION_HEADER]: this.fakeUser.accessToken };
        if (options.usingCookies) {
            headers['cookie'] = `refreshId=${this.fakeUser.refreshId}`;
        }
        options.headers = headers;
        return await this.httpService[method]<T>(url, options);
    }
}
