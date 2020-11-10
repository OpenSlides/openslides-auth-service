export namespace Config {
    export const DATABASE_PATH = 'database/';
    export const DATASTORE_READER = getReaderUrl();

    const VERBOSE_TRUE_FIELDS = ['1', 'y', 'yes', 'true', 'on'];

    function getReaderUrl(): string {
        const readerHost = process.env.DATASTORE_READER_HOST;
        const readerPort = process.env.DATASTORE_READER_PORT;
        if (!readerHost || !readerPort) {
            throw new Error('No datastore reader is defined.');
        }
        return `http://${readerHost}:${parseInt(readerPort, 10)}`;
    }

    export function isDevMode(): boolean {
        return VERBOSE_TRUE_FIELDS.includes(process.env.OPENSLIDES_DEVELOPMENT || '');
    }
}
