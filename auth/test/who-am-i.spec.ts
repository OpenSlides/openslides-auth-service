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

test('POST who-am-i', async () => {
    const user = await FakeRequest.login();
    const whoAmI = await Utils.requestPost('who-am-i');
    Validation.validateSuccessfulRequest(whoAmI);
    Validation.validateAccessToken(whoAmI);
});

test('POST who-am-i without cookie', async () => {
    const user = await FakeRequest.login();
    const whoAmI = await Utils.requestPostWithoutCredentials('who-am-i');
    Validation.validateSuccessfulRequest(whoAmI); // anonymous
});

test('GET who-am-i', async () => {
    await FakeRequest.login();
    try {
        await Utils.requestPost('who-am-i');
    } catch (e) {
        expect(e.status).toBe(403);
    }
});
