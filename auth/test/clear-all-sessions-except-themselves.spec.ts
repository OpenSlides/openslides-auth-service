import { FakeRequest } from './fake-request';
import { FakeUserService } from './fake-user-service';
import { TestDatabaseAdapter } from './test-database-adapter';
import { Utils } from './utils';

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

test('DELETE clear-all-sessions-except-themselves', async () => {
    const user = await FakeRequest.loginForNTimes(3);
    const sessionInformation = Utils.getSessionInformationFromUser(user);
    await Utils.requestPost('api/clear-all-sessions-except-themselves', { sessionId: sessionInformation.sessionId });
    const sessions = await Utils.requestGet('api/list-sessions');
    expect(sessions.sessions.length).toBe(1);
});
