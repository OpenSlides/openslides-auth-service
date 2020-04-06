const request = require('superagent');
const { sum } = require('./myapi');

const SERVER_URL = process.env.AUTH_URL || 'localhost:8000';

const getUrl = urlSuffix => {
    return `${SERVER_URL}${urlSuffix}`;
};

test('1 + 2 should be 3', () => {
    expect(sum(1, 2)).toBe(3);
});

test('example ajax request', async () => {
    const { body } = await request.get(getUrl('/'));
    expect(body.success).toBe(true);
    expect(body.message).toBe('Hello World');
});
