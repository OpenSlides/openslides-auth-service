import { Utils } from './utils';
import { Validation } from './validation';
import { TestContainer } from './test-container';

let container: TestContainer;

beforeAll(async () => {
    container = new TestContainer();
    await container.ready();
});

afterEach(async () => {
    container.user.reset();
    await container.redis.flushdb();
    await container.userService.init();
});

afterAll(async () => {
    await container.end();
});

test('POST login with credentials', async () => {
    const result = await container.request.login();
    Validation.validateSuccessfulRequest(result);
    Validation.validateAccessToken(result);
});

test('POST login twice - different session-ids', async () => {
    const sessionOne = Utils.getSessionInformationFromUser(await container.request.login());
    const sessionTwo = Utils.getSessionInformationFromUser(await container.request.login());
    expect(sessionOne.sessionId).not.toBe(sessionTwo.sessionId);
});

test('POST login while inactive', async () => {
    await container.userService.updateAdmin({ is_active: false });
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.login());
});

test('GET login', async () => {
    try {
        await container.http.get('login');
    } catch (e) {
        expect(e.status).toBe(404); // Not found
    }
});

test('POST login without password', async () => {
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.login('admin'));
});

test('POST login without username', async () => {
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.login(undefined, 'admin'));
});

test('POST login without credentials', async () => {
    await container.request.sendRequestAndValidateForbiddenRequest(container.http.post('login'));
});

test('POST login with wrong password', async () => {
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.login('admin', 'xyz'));
});

test('POST login with wrong username', async () => {
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.login('xyz', 'admin'));
});

test('POST login multiple users, only one alive', async () => {
    const toDelete = await container.userService.createUser('ash');
    await container.userService.deleteUser(toDelete);
    await container.userService.createUser('ash');
    const response = await container.request.login('ash', 'ash');
    Validation.validateSuccessfulRequest(response);
    Validation.validateAccessToken(response);
});

test('POST login multiple users, forbidden', async () => {
    await container.userService.createUser('ash');
    await container.userService.createUser('ash');
    await container.request.sendRequestAndValidateForbiddenRequest(container.request.login('ash', 'ash'));
});
