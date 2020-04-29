const request = require('superagent');

const SERVER_URL = process.env.AUTH_URL || 'http://localhost:8000';
const credentials = { username: 'admin', password: 'admin' };

const agent = request.agent();

const getUrl = urlSuffix => {
    return `${SERVER_URL}${urlSuffix}`;
};

test('Ajax request to server', async () => {
    const { body } = await request.get(getUrl('/'));
    expect(body.success).toBe(true);
    expect(body.message).toBe('Hello World');
});

test('POST login with credentials', async () => {
    const { body } = await request.post(getUrl('/login')).send(credentials);
    const tokenParts = body.token.split('.');
    expect(body.success).toBe(true);
    expect(body.token).not.toBeNull();
    expect(tokenParts.length).toBe(3);
});

test('POST who-am-i', async () => {
    await agent
        .post(getUrl('/login'))
        .withCredentials()
        .send(credentials)
        .set('X-API-Key', 'foobar')
        .set('Accept', 'application/json')
        .then(async res => {
            const { body } = await agent.post(getUrl('/who-am-i'));
            const tokenParts = body.token.split('.');
            expect(body.success).toBe(true);
            expect(body.token).not.toBeNull();
            expect(tokenParts.length).toBe(3);
        });
});

test('POST logout', async () => {
    await agent
        .post(getUrl('/login'))
        .withCredentials()
        .send(credentials)
        .set('Accept', 'application/json')
        .then(async res => {
            await agent
                .post(getUrl('/api/logout'))
                .set('authentication', res.body.token)
                .then(answer => {
                    expect(answer.body.success).toBe(true);
                });
        });
});
