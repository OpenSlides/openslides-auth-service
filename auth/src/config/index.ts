import fs from 'fs';

export namespace Config {
    export const DATABASE_PATH = 'database/';
    export const DATASTORE_READER = getReaderUrl();

    function getReaderUrl(): string {
        if (!process.env.DATASTORE_READER_HOST || !process.env.DATASTORE_READER_PORT) {
            throw new Error('No datastore reader is defined.');
        }
        return `http://${process.env.DATASTORE_READER_HOST}:${parseInt(process.env.DATASTORE_READER_PORT, 10)}`;
    }
}

export namespace Keys {
    const encoding = 'utf8';
    const pathToKeys = '/tmp/keys';

    export function publicTokenKey(): string {
        return fs.readFileSync(getFile('rsa-token.key.pub'), encoding);
    }

    export function publicCookieKey(): string {
        return fs.readFileSync(getFile('rsa-cookie.key.pub'), encoding);
    }

    export function privateTokenKey(): string {
        return fs.readFileSync(getFile('rsa-token.key'), encoding);
    }

    export function privateCookieKey(): string {
        return fs.readFileSync(getFile('rsa-cookie.key'), encoding);
    }

    function getFile(path: string): string {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        return `${pathToKeys}${path}`;
    }
}
