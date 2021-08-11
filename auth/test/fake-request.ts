import { FakeUserService } from './fake-user-service';
import { Utils } from './utils';
import { Validation } from './validation';

export namespace FakeRequest {
    const fakeUserService = FakeUserService.getInstance();
    const fakeUser = fakeUserService.getFakeUser();

    export async function login(): Promise<Utils.ServerResponse> {
        return await Utils.requestPost('login', Utils.credentials).then(response => {
            fakeUser.accessToken = response.headers.authentication;
            return response;
        });
    }

    export async function loginForNTimes(n: number): Promise<Utils.ServerResponse[]> {
        const response: Utils.ServerResponse[] = [];
        for (let i = 0; i < n; ++i) {
            response.push(await login());
        }
        return response;
    }

    export async function authenticate(): Promise<Utils.ServerResponse> {
        return await Utils.requestInternalPost('authenticate');
    }

    export async function sendRequestAndValidateForbiddenRequest(request: Promise<any>): Promise<void> {
        try {
            await request;
        } catch (e) {
            if (Utils.isErrorResponse(e)) {
                handleError(e);
            } else {
                Validation.validateForbiddenRequest(e);
            }
        }
    }

    function handleError(error: Utils.ErrorResponse): void {
        Validation.validateForbiddenRequest(error);
    }
}
