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

test('POST clear-session-by-id', async () => {
    const user = await container.request.login();
    const sessionInformation = Utils.getSessionInformationFromUser(user);
    await container.request.post('secure/clear-session-by-id', {
        data: { sessionId: sessionInformation.sessionId }
    });
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.authenticate());
});
