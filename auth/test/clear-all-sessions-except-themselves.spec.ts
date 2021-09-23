import { FakeRequest } from './fake-request';
import { FakeUserService } from './fake-user-service';
import { TestDatabaseAdapter } from './test-database-adapter';
import { Utils } from './utils';
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

test('POST clear-all-sessions-except-themselves', async () => {
    const user = (await FakeRequest.loginForNTimes(3))[2];
    const sessionInformation = Utils.getSessionInformationFromUser(user);
    await FakeHttpService.post('secure/clear-all-sessions-except-themselves', {
        data: { sessionId: sessionInformation.sessionId }
    });
    const sessions = await FakeHttpService.get<{ sessions: string[] }>('secure/list-sessions');
    expect(sessions.sessions.length).toBe(1);
});
