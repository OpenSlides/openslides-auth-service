import { TestContainer } from './test-container';
import { Utils } from './utils';

let container: TestContainer;

beforeAll(async () => {
    container = new TestContainer();
    await container.ready();
});

afterAll(async () => {
    await container.end();
});

test('POST hash', async () => {
    const hashValue = await container.http.post('hash', {
        data: { toHash: 'helloworld' },
        internal: true
    });
    expect(hashValue.hash.substring(0, 7)).toMatch('$argon2');
});

test('POST hash random salt', async () => {
    const toHash = { toHash: 'a password' };
    const hashValue = await container.http.post('hash', { data: toHash, internal: true });
    const toCompare = await container.http.post('hash', { data: toHash, internal: true });
    expect(hashValue.hash).not.toBe(toCompare.hash);
});

test('POST is-equals', async () => {
    const toHashValue = { toHash: 'helloworld' };
    const toCompareValue = await container.http.post('hash', { data: toHashValue, internal: true });
    const hashValue = await container.http.post('is-equals', {
        internal: true,
        data: {
            toHash: toHashValue.toHash,
            toCompare: toCompareValue.hash
        }
    });
    expect(hashValue.isEquals).toBe(true);
});

test('POST deprecated SHA-512 hashed password', async () => {
    const hashValue = await container.http.post('is-equals', {
        internal: true,
        data: {
            toHash: 'admin',
            toCompare: Utils.deprecatedPasswordHash
        }
    });
    expect(hashValue.isEquals).toBe(true);
});
