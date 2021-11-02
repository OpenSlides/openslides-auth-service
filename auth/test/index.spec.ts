import { Validation } from './validation';
import { TestContainer } from './test-container';

// Adds custom jest-functions.
declare global {
    namespace jest {
        interface Matchers<R> {}
    }
}

let container: TestContainer;

beforeAll(async () => {
    container = new TestContainer();
    await container.ready();
});

afterAll(async () => {
    await container.end();
});

test('Server is available', async () => {
    const result = await container.http.get('');
    Validation.validateSuccessfulRequest(result, 'Authentication service is available');
});

test('Secured routes are available', async () => {
    await container.request.login();
    const result = await container.request.get('secure');
    Validation.validateSuccessfulRequest(result, 'Yeah! A secure route!');
});
