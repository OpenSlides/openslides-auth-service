import { FakeRequest } from './fake-request';
import { FakeUserService } from './fake-user-service';
import { TestDatabaseAdapter } from './test-database-adapter';
import { Validation } from './validation';
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

test('POST auth', async () => {
    await FakeRequest.login();
    const answer = await FakeRequest.authenticate();
    Validation.validateAuthentication(answer, 1);
});

test('POST auth without cookie', async () => {
    await FakeRequest.login();
    const answer = await FakeRequest.authenticate({ usingCookies: false });
    Validation.validateAuthentication(answer, 0, 'anonymous'); // anonymous
});

test('POST auth without access-token', async () => {
    await FakeRequest.login();
    FakeUserService.getInstance().unsetAccessTokenInFakeUser();
    const answer = await FakeRequest.authenticate();
    Validation.validateAnonymous(answer);
});

test('POST auth with malified access-token', async () => {
    await FakeRequest.login();
    FakeUserService.getInstance().manipulateAccessTokenInFakeUser();
    await FakeRequest.sendRequestAndValidateForbiddenRequest(FakeRequest.authenticate());
});

test('POST auth with wrong access-token', async () => {
    await FakeRequest.login();
    FakeUserService.getInstance().removeACharacterFromAccessTokenInFakeUser();
    await FakeRequest.sendRequestAndValidateForbiddenRequest(FakeRequest.authenticate());
});

test('POST auth renew access-token', async () => {
    await FakeRequest.login();
    FakeUserService.getInstance().setAccessTokenToExpired();
    const answer = await FakeRequest.authenticate();
    Validation.validateAccessToken(answer);
});

test('POST auth with expired cookie', async () => {
    await FakeRequest.login();
    fakeUser.accessToken = FakeTicketService.getExpiredJwt(fakeUser.accessToken, 'token');
    fakeUser.refreshId = FakeTicketService.getExpiredJwt(fakeUser.refreshId, 'cookie');
    Validation.validateAnonymous(await FakeRequest.authenticate());
});
