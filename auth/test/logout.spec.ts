import { Validation } from './validation';
import { TestContainer } from './test-container';

let container: TestContainer;

beforeAll(async () => {
    container = new TestContainer();
    await container.ready();
});

afterEach(async () => {
    container.user.reset();
    await container.redis.flushdb();
});

afterAll(async () => {
    await container.end();
});

test('POST logout', async () => {
    await container.request.login();
    const response = await container.request.post('secure/logout');
    Validation.validateSuccessfulRequest(response);
});

test('POST logout without access-token', async () => {
    await container.request.login();
    container.userService.unsetAccessTokenInFakeUser();
    const response = await container.request.post('secure/logout');
    Validation.validateSuccessfulRequest(response, 'anonymous');
});

test('POST logout without cookie', async () => {
    await container.request.login();
    const response = await container.request.post('secure/logout', { usingCookies: false });
    Validation.validateSuccessfulRequest(response, 'anonymous');
});
