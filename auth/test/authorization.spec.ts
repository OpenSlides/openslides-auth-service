import { AuthHandler } from '../src/api/interfaces/auth-handler';
import { TestContainer } from './test-container';

interface AuthorizationToken {
    email: string;
    userId: number | string;
}

const exampleEmail = 'maxmustermann@example.com';

let container: TestContainer;

beforeAll(async () => {
    container = new TestContainer();
    await container.ready();
});

afterAll(async () => {
    await container.end();
});

test('Create authorization token', async () => {
    const response = await container.http.post('create-authorization-token', {
        data: { userId: 1, email: exampleEmail },
        internal: true
    });
    const token = response.headers[AuthHandler.AUTHORIZATION_HEADER] as string;

    expect(response.status).toBe(200);
    expect(typeof token === 'string').toBeTruthy();
    expect(token.startsWith('bearer ')).toBeTruthy();
});

test('Verify authorization token', async () => {
    const response = await container.http.post('create-authorization-token', {
        data: { userId: 1, email: exampleEmail },
        internal: true
    });
    const token = response.headers[AuthHandler.AUTHORIZATION_HEADER] as string;
    const next = await container.http.post<AuthorizationToken>('verify-authorization-token', {
        headers: { [AuthHandler.AUTHORIZATION_HEADER]: token },
        internal: true
    });
    expect(next.status).toBe(200);
    expect(next.userId).toBe(1);
    expect(next.email).toBe(exampleEmail);
});
