const getReaderUrl = (): string => {
    const readerHost = process.env.DATASTORE_READER_HOST;
    const readerPort = process.env.DATASTORE_READER_PORT;
    if (!readerHost || !readerPort) {
        throw new Error('No datastore reader is defined.');
    }
    return `http://${readerHost}:${parseInt(readerPort, 10)}`;
};

export class Config {
    public static readonly DATABASE_PATH = 'database/';
    public static readonly DATASTORE_READER = getReaderUrl();

    private static readonly VERBOSE_TRUE_FIELDS = ['1', 'true', 'on'];

    public static isDevMode(): boolean {
        return this.VERBOSE_TRUE_FIELDS.includes((process.env.OPENSLIDES_DEVELOPMENT || '').toLowerCase());
    }
}
