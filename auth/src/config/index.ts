import fs from 'fs';

// export const AUTH_SERVER = {
//     authorizationEndpoint: 'http://localhost:9001/authorize',
//     tokenEndpoint: 'http://localhost:9001/token'
// };

export namespace Config {
    export const DATABASE_PATH = 'database/';
    export const DATASTORE_READER = `${process.env.INSTANCE_DOMAIN || 'http://127.0.0.1'}:9010`;
    export const DATASTORE_WRITER = `${process.env.INSTANCE_DOMAIN || 'http://localhost'}:9011`;
}

export namespace Keys {
    const encoding = 'utf8';
    const pathToFiles = 'src/config';

    export function publicKey(): string {
        return fs.readFileSync(getFile('public.key'), encoding);
    }

    export function publicCookieKey(): string {
        return fs.readFileSync(getFile('public-cookie.key'), encoding);
    }

    export function privateKey(): string {
        return fs.readFileSync(getFile('private.key'), encoding);
    }

    export function privateCookieKey(): string {
        return fs.readFileSync(getFile('private-cookie.key'), encoding);
    }

    function getFile(path: string): string {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        return `${pathToFiles}${path}`;
    }
}
