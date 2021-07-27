import { Utils } from './utils';

test('POST hash', async () => {
    const hashValue = await Utils.requestInternalPost('hash', {
        toHash: 'helloworld'
    });
    expect(hashValue.hash.length).toBe(152);
});

test('POST hash random salt', async () => {
    const toHash = { toHash: 'a password' };
    const hashValue = await Utils.requestInternalPost('hash', toHash);
    const toCompare = await Utils.requestInternalPost('hash', toHash);
    expect(hashValue.hash).not.toBe(toCompare.hash);
});

test('POST is-equals', async () => {
    const toHashValue = { toHash: 'helloworld' };
    const toCompareValue = await Utils.requestInternalPost('hash', toHashValue);
    const hashValue = await Utils.requestInternalPost('is-equals', {
        toHash: toHashValue.toHash,
        toCompare: toCompareValue.hash
    });
    expect(hashValue.isEquals).toBe(true);
});
