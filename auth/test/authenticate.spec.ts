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

test('POST auth', async () => {
    await container.request.login();
    const answer = await container.request.authenticate();
    Validation.validateAuthentication(answer, container.userService.currentAdminId);
});

test('POST auth without cookie', async () => {
    await container.request.login();
    const answer = await container.request.authenticate({ usingCookies: false });
    Validation.validateAuthentication(answer, 0, 'anonymous'); // anonymous
});

test('POST auth without access-token', async () => {
    await container.request.login();
    container.userService.unsetAccessTokenInFakeUser();
    const answer = await container.request.authenticate();
    Validation.validateAnonymous(answer);
});

test('POST auth with malified access-token', async () => {
    await container.request.login();
    container.userService.manipulateAccessTokenInFakeUser();
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.authenticate());
});

test('POST auth with wrong access-token', async () => {
    await container.request.login();
    container.userService.removeACharacterFromAccessTokenInFakeUser();
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.authenticate());
});

test('POST auth renew access-token', async () => {
    await container.request.login();
    container.userService.setAccessTokenToExpired();
    const answer = await container.request.authenticate();
    Validation.validateAccessToken(answer);
});

test('POST auth with expired cookie', async () => {
    await container.request.login();
    container.user.accessToken = container.ticketService.getExpiredJwt(container.user.accessToken, 'token');
    container.user.refreshId = container.ticketService.getExpiredJwt(container.user.refreshId, 'cookie');
    Validation.validateAnonymous(await container.request.authenticate());
});
