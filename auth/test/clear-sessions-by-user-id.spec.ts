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
    const fqid = await container.userService.createUser('user1');
    const user = await container.request.login('user1', 'user1');
    const admin = await container.request.login();
    await container.request.post('internal/clear-sessions-by-user-id', {
        data: { userId: +fqid.split('/')[1] }
    });
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.authenticate());
});
