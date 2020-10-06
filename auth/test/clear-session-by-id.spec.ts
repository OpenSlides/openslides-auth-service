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

test('DELETE clear-session-by-id', async () => {
    const user = await FakeRequest.login();
    const sessionInformation = Utils.getSessionInformationFromUser(user);
    await Utils.requestDelete('api/clear-session-by-id', { sessionId: sessionInformation.sessionId });
    await FakeRequest.sendRequestAndValidateForbiddenRequest(FakeRequest.authenticate());
});
