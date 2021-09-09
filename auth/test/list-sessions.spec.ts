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
    fakeUser.reset();
    await database.flushdb();
});

afterAll(() => {
    database.end();
    return;
});

test('GET list-sessions', async () => {
    const user = (await Utils.getNSessions(1))[0];
    const sessions = await Utils.getAllActiveSessions();
    expect(sessions.length).toBe(1);
    expect(sessions.includes(user.sessionId)).toBeTruthy();
});

test('GET list-sessions #2', async () => {
    const users = await Utils.getNSessions(3);
    const sessions = await Utils.getAllActiveSessions();
    expect(sessions.length).toBe(3);
    for (const user of users) {
        expect(sessions.includes(user.sessionId)).toBeTruthy();
    }
});
