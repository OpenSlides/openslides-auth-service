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

test('GET list-sessions', async () => {
    const user = (await container.request.getNSessions(1))[0];
    const sessions = await container.request.getAllActiveSessions();
    expect(sessions.length).toBe(1);
    expect(sessions.includes(user.sessionId)).toBeTruthy();
});

test('GET list-sessions #2', async () => {
    const users = await container.request.getNSessions(3);
    const sessions = await container.request.getAllActiveSessions();
    expect(sessions.length).toBe(3);
    expect(users.every(user => sessions.includes(user.sessionId))).toBeTruthy();
});
