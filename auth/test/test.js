const request = require('superagent');

const SERVER_URL = process.env.AUTH_URL || 'localhost:8000';
const credentials = { username: 'admin', password: 'admin' };

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
    expect(body.success).toBe(false);
    expect(body.message).toBe('Your requested resource is not found...');
});

test('POST login with credentials', async () => {
    const { body } = await request.post(getUrl('/login')).send(credentials);
    const tokenParts = body.token.split('.');
    expect(body.success).toBe(true);
    expect(body.token);
    expect(tokenParts.length).toBe(3);
});

test('POST who-am-i', async () => {
    const { body: bodyFirstRequest } = await request.post(getUrl('/login')).send(credentials);
    const { body: bodySecondRequest } = await request.post(getUrl('/who-am-i'));
});
