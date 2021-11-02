import { Validation } from './validation';
import { TestContainer } from './test-container';
import { SessionInformation } from './utils';

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

test('POST who-am-i', async () => {
    await container.request.login();
    const whoAmI = await container.request.post('who-am-i');
    Validation.validateAccessToken(whoAmI);
});

test('POST who-am-i without cookie', async () => {
    await container.request.login();
    const whoAmI = await container.request.post<SessionInformation>('who-am-i', { usingCookies: false });
    Validation.validateAnonymous(whoAmI);
});

test('POST who-am-i with expired cookie', async () => {
    await container.request.login();
    container.user.accessToken = '';
    container.user.refreshId = container.ticketService.getExpiredJwt(container.user.refreshId, 'cookie');
    Validation.validateAnonymous(await container.request.post('who-am-i'));
});

test('POST who-am-i with undefined token', async () => {
    await container.request.login();
    container.userService.unsetAccessTokenInFakeUser();
    const whoAmI = await container.request.post('who-am-i');
    Validation.validateAccessToken(whoAmI);
});

test('POST who-am-i with empty cookie', async () => {
    await container.request.login();
    Validation.validateAnonymous(
        await container.http.post('who-am-i', { headers: { cookie: 'refreshId=""' }, usingCookies: false })
    );
});

test('POST who-am-i with null cookie', async () => {
    await container.request.login();
    await container.request.sendRequestAndValidateForbiddenRequest(
        container.http.post('who-am-i', { headers: { cookie: 'refreshId=null' }, usingCookies: false })
    );
});

test('POST who-am-i with expired token and expired cookie', async () => {
    await container.request.login();
    container.user.accessToken = container.ticketService.getExpiredJwt(container.user.accessToken, 'token');
    container.user.refreshId = container.ticketService.getExpiredJwt(container.user.refreshId, 'cookie');
    Validation.validateAnonymous(await container.request.post('who-am-i'));
});
