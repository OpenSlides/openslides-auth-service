const request = require('superagent');
const { sum } = require('./myapi');

test('1 + 2 should be 3', () => {
    expect(sum(1, 2)).toBe(3);
});

test('example ajax request', async () => {
    const { body } = await request.get('localhost:8000/');
    expect(body.success).toBe(true);
    expect(body.message).toBe('Hello World');
});
