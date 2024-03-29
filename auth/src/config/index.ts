const getUrl = (hostVar: string, portVar: string): string => {
    const host = process.env[hostVar];
    const port = process.env[portVar];
    if (!host || !port) {
        throw new Error(`${hostVar} or ${portVar} is not defined.`);
    }
    return `http://${host}:${parseInt(port, 10)}`;
};

export class Config {
    public static readonly DATABASE_PATH = 'database/';
    public static readonly DATASTORE_READER = getUrl('DATASTORE_READER_HOST', 'DATASTORE_READER_PORT');
    public static readonly DATASTORE_WRITER = getUrl('DATASTORE_WRITER_HOST', 'DATASTORE_WRITER_PORT');
    public static readonly ACTION_URL = getUrl('ACTION_HOST', 'ACTION_PORT');

    public static readonly TOKEN_EXPIRATION_TIME = 600;

    private static readonly VERBOSE_TRUE_FIELDS = ['1', 'true', 'on'];

    public static isDevMode(): boolean {
        return this.isTruthy(process.env.OPENSLIDES_DEVELOPMENT);
    }

    public static isOtelEnabled(): boolean {
        return this.isTruthy(process.env.OPENTELEMETRY_ENABLED);
    }

    private static isTruthy(value?: string): boolean {
        return this.VERBOSE_TRUE_FIELDS.includes(value?.toLowerCase() || '');
    }
}
