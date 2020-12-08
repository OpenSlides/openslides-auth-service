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

test('POST logout', async () => {
    await FakeRequest.login();
    const response = await Utils.requestPost('secure/logout');
    Validation.validateSuccessfulRequest(response);
    expect(response.message).toBe('Successfully signed out!');
});

test('POST logout without access-token', async () => {
    await FakeRequest.login();
    FakeUserService.getInstance().unsetAccessTokenInFakeUser();
    const response = await Utils.requestPost('secure/logout');
    expect(response.success).toBe(true);
});

test('POST logout without cookie', async () => {
    await FakeRequest.login();
    const response = await Utils.requestPostWithoutCredentials('secure/logout');
    expect(response.success).toBe(true);
});
