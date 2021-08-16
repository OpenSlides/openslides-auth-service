import { FakeHttpService } from './fake-http-service';

test('POST hash', async () => {
    const hashValue = await FakeHttpService.post('hash', {
        data: { toHash: 'helloworld' },
        internal: true
    });
    expect(hashValue.hash.length).toBe(152);
});

test('POST hash random salt', async () => {
    const toHash = { toHash: 'a password' };
    const hashValue = await FakeHttpService.post('hash', { data: toHash, internal: true });
    const toCompare = await FakeHttpService.post('hash', { data: toHash, internal: true });
    expect(hashValue.hash).not.toBe(toCompare.hash);
});

test('POST is-equals', async () => {
    const toHashValue = { toHash: 'helloworld' };
    const toCompareValue = await FakeHttpService.post('hash', { data: toHashValue, internal: true });
    const hashValue = await FakeHttpService.post('is-equals', {
        internal: true,
        data: {
            toHash: toHashValue.toHash,
            toCompare: toCompareValue.hash
        }
    });
    expect(hashValue.isEquals).toBe(true);
});
