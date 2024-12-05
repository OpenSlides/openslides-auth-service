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

test('POST clear-sessions-by-user-id', async () => {
    await container.request.login();
    await container.http.post('clear-sessions-by-user-id', {
        data: { userId: 1 }, 
        internal: true
    });
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.authenticate());
});
