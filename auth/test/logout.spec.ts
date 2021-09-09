import { FakeRequest } from './fake-request';
import { FakeUserService } from './fake-user-service';
import { TestDatabaseAdapter } from './test-database-adapter';
import { Validation } from './validation';
import { FakeHttpService } from './fake-http-service';

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

test('POST logout', async () => {
    await FakeRequest.login();
    const response = await FakeHttpService.post('secure/logout');
    Validation.validateSuccessfulRequest(response);
});

test('POST logout without access-token', async () => {
    await FakeRequest.login();
    FakeUserService.getInstance().unsetAccessTokenInFakeUser();
    const response = await FakeHttpService.post('secure/logout');
    Validation.validateSuccessfulRequest(response, 'anonymous');
});

test('POST logout without cookie', async () => {
    await FakeRequest.login();
    const response = await FakeHttpService.post('secure/logout', { usingCookies: false });
    Validation.validateSuccessfulRequest(response, 'anonymous');
});
