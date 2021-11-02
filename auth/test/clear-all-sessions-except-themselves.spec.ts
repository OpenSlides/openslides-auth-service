import { Utils } from './utils';
import { TestContainer } from './test-container';

let container: TestContainer;

beforeAll(async () => {
    container = new TestContainer();
    await container.ready();
});

afterEach(async () => {
    container.user.reset();
    await container.redis.flushdb();
});

afterAll(async () => {
    await container.end();
});

test('POST clear-all-sessions-except-themselves', async () => {
    const user = (await container.request.loginForNTimes(3))[2];
    const sessionInformation = Utils.getSessionInformationFromUser(user);
    await container.request.post('secure/clear-all-sessions-except-themselves', {
        data: { sessionId: sessionInformation.sessionId }
    });
    const sessions = await container.request.get<{ sessions: string[] }>('secure/list-sessions');
    expect(sessions.sessions.length).toBe(1);
});
