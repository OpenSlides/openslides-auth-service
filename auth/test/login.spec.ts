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

test('POST login with credentials', async () => {
    const result = await FakeRequest.login();
    Validation.validateSuccessfulRequest(result);
    Validation.validateAccessToken(result);
});

test('GET login', async () => {
    try {
        await Utils.requestGet('login');
    } catch (e) {
        expect(e.status).toBe(404); // Not found
    }
});

test('POST login without password', async () => {
    try {
        await Utils.requestPost('login', { username: 'admin' });
    } catch (e) {
        Validation.validateForbiddenRequest(e);
    }
});

test('POST login without username', async () => {
    try {
        await Utils.requestPost('login', { password: 'admin' });
    } catch (e) {
        Validation.validateForbiddenRequest(e);
    }
});

test('POST login without credentials', async () => {
    try {
        await Utils.requestPost('login');
    } catch (e) {
        Validation.validateForbiddenRequest(e);
    }
});
