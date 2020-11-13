export namespace Config {
    export const DATABASE_PATH = 'database/';
    export const DATASTORE_READER = getReaderUrl();

    function getReaderUrl(): string {
        if (!process.env.DATASTORE_READER_HOST || !process.env.DATASTORE_READER_PORT) {
            throw new Error('No datastore reader is defined.');
        }
        return `http://${process.env.DATASTORE_READER_HOST}:${parseInt(process.env.DATASTORE_READER_PORT, 10)}`;
    }

    export function isDevMode(): boolean {
        return process.env.OPENSLIDES_DEVELOPMENT === '1';
    }
}
