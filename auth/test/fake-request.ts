import { FakeUserService } from './fake-user-service';
import { Utils } from './utils';

export namespace FakeRequest {
    const fakeUserService = FakeUserService.getInstance();
    const fakeUser = fakeUserService.getFakeUser();

    export async function login(): Promise<Utils.ServerResponse> {
        return await Utils.requestPost('login', Utils.credentials).then(response => {
            fakeUser.accessToken = response.headers.authentication;
            return response;
        });
    }

    export async function authenticate(): Promise<Utils.ServerResponse> {
        return await Utils.requestInternalPost('api/authenticate');
    }
}
