const request = require('superagent');

const SERVER_URL = process.env.AUTH_URL || 'localhost:8000';

const getUrl = urlSuffix => {
    return `${SERVER_URL}${urlSuffix}`;
};

test('Ajax request to server', async () => {
    const { body } = await request.get(getUrl('/'));
    expect(body.success).toBe(true);
    expect(body.message).toBe('Hello World');
});

test('GET login', async () => {
    const { body } = await request.get(getUrl('/login'));
});

test('POST login with credentials', async () => {
    const { body } = await request.post(getUrl('/login')).send({ username: 'admin', password: 'admin' });
    expect(body.success).toBe(true);
    expect(body.token);
});
