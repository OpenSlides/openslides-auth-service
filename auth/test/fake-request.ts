import { FakeUserService } from './fake-user-service';
import { Utils } from './utils';
import { Validation } from './validation';
import { FakeHttpService } from './fake-http-service';
import { HttpResponse } from '../src/api/interfaces/http-handler';

export namespace FakeRequest {
    const fakeUserService = FakeUserService.getInstance();
    const fakeUser = fakeUserService.getFakeUser();

    export async function login(): Promise<HttpResponse> {
        return await FakeHttpService.post('login', { data: Utils.credentials }).then(response => {
            fakeUser.accessToken = response.headers.authentication as string;
            fakeUser.refreshId = response.cookies['refreshId'];
            return response;
        });
    }

    export async function loginForNTimes(n: number): Promise<HttpResponse[]> {
        const response: HttpResponse[] = [];
        for (let i = 0; i < n; ++i) {
            response.push(await login());
        }
        return response;
    }

    export async function authenticate(options: { usingCookies?: boolean } = {}): Promise<HttpResponse> {
        return await FakeHttpService.post('authenticate', { usingCookies: options.usingCookies, internal: true });
    }

    export async function sendRequestAndValidateForbiddenRequest(request: Promise<any>): Promise<void> {
        handleError(await request);
    }

    function handleError(error: any): void {
        Validation.validateForbiddenRequest(error);
    }
}
