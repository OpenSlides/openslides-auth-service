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

test('POST clear-session-by-id', async () => {
    const user = await FakeRequest.login();
    const sessionInformation = Utils.getSessionInformationFromUser(user);
    await FakeHttpService.post('secure/clear-session-by-id', {
        data: { sessionId: sessionInformation.sessionId }
    });
    await FakeRequest.sendRequestAndValidateForbiddenRequest(FakeRequest.authenticate());
});
