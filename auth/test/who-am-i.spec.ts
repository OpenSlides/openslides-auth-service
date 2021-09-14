import { FakeRequest } from './fake-request';
import { FakeUserService } from './fake-user-service';
import { TestDatabaseAdapter } from './test-database-adapter';
import { Validation } from './validation';
import { FakeHttpService } from './fake-http-service';
import { FakeTicketService } from './fake-ticket-service';

const fakeUserService = FakeUserService.getInstance();
const fakeUser = fakeUserService.getFakeUser();

let database: TestDatabaseAdapter;

beforeAll(async () => {
    database = new TestDatabaseAdapter();
    await database.init();
});

afterEach(async () => {
    fakeUser.reset();
    await database.flushdb();
});

afterAll(() => {
    database.end();
    return;
});

test('POST who-am-i', async () => {
    await FakeRequest.login();
    const whoAmI = await FakeHttpService.post('who-am-i');
    Validation.validateAccessToken(whoAmI);
});

test('POST who-am-i without cookie', async () => {
    await FakeRequest.login();
    const whoAmI = await FakeHttpService.post('who-am-i', { usingCookies: false });
    Validation.validateAnonymous(whoAmI);
});

test('POST who-am-i with expired cookie', async () => {
    await FakeRequest.login();
    fakeUser.accessToken = '';
    fakeUser.refreshId = FakeTicketService.getExpiredJwt(fakeUser.refreshId, 'cookie');
    Validation.validateAnonymous(await FakeHttpService.post('who-am-i'));
});

test('POST who-am-i with undefined token', async () => {
    await FakeRequest.login();
    FakeUserService.getInstance().unsetAccessTokenInFakeUser();
    const whoAmI = await FakeHttpService.post('who-am-i');
    Validation.validateAccessToken(whoAmI);
});

test('POST who-am-i with empty cookie', async () => {
    await FakeRequest.login();
    Validation.validateAnonymous(
        await FakeHttpService.post('who-am-i', { headers: { cookie: 'refreshId=""' }, usingCookies: false })
    );
});

test('POST who-am-i with null cookie', async () => {
    await FakeRequest.login();
    await FakeRequest.sendRequestAndValidateForbiddenRequest(
        FakeHttpService.post('who-am-i', { headers: { cookie: 'refreshId=null' }, usingCookies: false })
    );
});

test('POST who-am-i with expired token and expired cookie', async () => {
    await FakeRequest.login();
    fakeUser.accessToken = FakeTicketService.getExpiredJwt(fakeUser.accessToken, 'token');
    fakeUser.refreshId = FakeTicketService.getExpiredJwt(fakeUser.refreshId, 'cookie');
    Validation.validateAnonymous(await FakeHttpService.post('who-am-i'));
});
