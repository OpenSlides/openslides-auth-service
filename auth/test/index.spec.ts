import { Utils } from './utils';
import { Validation } from './validation';

// Adds custom jest-functions.
declare global {
    namespace jest {
        interface Matchers<R> {}
    }
}

test('Server is available', async () => {
    const result = await Utils.requestGet('');
    Validation.validateSuccessfulRequest(result);
    expect(result.message).toBe('Authentication service is available');
});
