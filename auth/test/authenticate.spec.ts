import { FakeRequest } from './fake-request';
import { FakeUserService } from './fake-user-service';
import { TestDatabaseAdapter } from './test-database-adapter';
import { Utils } from './utils';
import { Validation } from './validation';

const fakeUserService = FakeUserService.getInstance();
const fakeUser = fakeUserService.getFakeUser();

let database: TestDatabaseAdapter;

beforeAll(async () => {
    database = new TestDatabaseAdapter();
    await database.init();
});

afterEach(async () => {
    fakeUser.accessToken = '';
    await database.flushdb();
});

afterAll(() => {
    database.end();
    return;
});

test('POST auth', async () => {
    await FakeRequest.login();
    const answer = await Utils.requestInternalPost('authenticate');
    expect(answer.success).toBe(true);
    expect(answer.userId).toBe(1);
});

test('POST auth without cookie', async () => {
    await FakeRequest.login();
    const answer = await Utils.requestInternalPostWithoutCookies('authenticate');
    expect(answer.success).toBe(true);
    expect(answer.userId).toBe(0); // anonymous
});

test('POST auth without access-token', async () => {
    await FakeRequest.login();
    FakeUserService.getInstance().unsetAccessTokenInFakeUser();
    const answer = await FakeRequest.authenticate();
    Validation.validateAuthentication(answer, 0); // anonymous
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
    expect(answer.success).toBe(true);
});
