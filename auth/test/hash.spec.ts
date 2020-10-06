import { Utils } from './utils';

test('POST hash', async () => {
    const hashValue = await Utils.requestInternalPost('hash', { toHash: 'helloworld' });
    expect(hashValue.message).toBe(
        'FZQkTVLy2MErFCu2H0e8Lq9QPW2cqEgMrp/PES9m5JZ9xej6mCheNtuK8bj/qLhMsV4PvPg2w964A8E/N2WaYA=='
    );
});
