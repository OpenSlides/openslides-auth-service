import { FakeRequest } from './fake-request';
import { Validation } from './validation';
import { FakeHttpService } from './fake-http-service';

// Adds custom jest-functions.
declare global {
    namespace jest {
        interface Matchers<R> {}
    }
}

test('Server is available', async () => {
    const result = await FakeHttpService.get('');
    Validation.validateSuccessfulRequest(result, 'Authentication service is available');
});

test('Secured routes are available', async () => {
    await FakeRequest.login();
    const result = await FakeHttpService.get('secure');
    Validation.validateSuccessfulRequest(result, 'Yeah! A secure route!');
});
