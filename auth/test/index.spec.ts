import { FakeRequest } from './fake-request';
import { Utils } from './utils';
import { Validation } from './validation';

// Adds custom jest-functions.
declare global {
    namespace jest {
        interface Matchers<R> {}
    }
}

test('Server is available', async () => {
    const result = await Utils.requestGet('');
    Validation.validateSuccessfulRequest(result, 'Authentication service is available');
});

test('Secured routes are available', async () => {
    await FakeRequest.login();
    const result = await Utils.requestGet('secure/hello');
    Validation.validateSuccessfulRequest(result, 'Yeah! An api resource!');
});
