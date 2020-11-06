import { Utils } from './utils';

test('POST hash', async () => {
    const hashValue = await Utils.requestInternalPost('hash', {
        toHash: 'helloworld'
    });
    expect(hashValue.hash.length).toBe(152);
});

test('POST hash random salt', async () => {
    const toHash = {toHash: 'a password'}
    const hashValue = await Utils.requestInternalPost('hash', toHash)
    const toCompare = await Utils.requestInternalPost('hash', toHash)
    expect(hashValue.hash).not.toBe(toCompare.hash)
})

test('POST is-equals', async () => {
    const hashValue = await Utils.requestInternalPost('is-equals', {
        toHash: 'helloworld',
        toCompare:
            '316af7b2ddc20ead599c38541fbe87e9a9e4e960d4017d6e59de188b41b2758fww7VCxnNrYsz6Z38Fv+' +
            'Wf6o4Ait5IkAE21CyknNS05lHSIzwF5AAObWhjzkeqV+oQ/Xc1y7FPsPg+n8cZnZy6w=='
    });
    expect(hashValue.isEquals).toBe(true);
});
