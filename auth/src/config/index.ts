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

    // Datastore URLs - only initialize if environment variables are available
    public static get DATASTORE_READER(): string {
        const host = process.env.DATASTORE_READER_HOST;
        const port = process.env.DATASTORE_READER_PORT;
        if (!host || !port) {
            throw new Error('DATASTORE_READER_HOST or DATASTORE_READER_PORT is not defined.');
        }
        return `http://${host}:${parseInt(port, 10)}`;
    }

    public static get DATASTORE_WRITER(): string {
        const host = process.env.DATASTORE_WRITER_HOST;
        const port = process.env.DATASTORE_WRITER_PORT;
        if (!host || !port) {
            throw new Error('DATASTORE_WRITER_HOST or DATASTORE_WRITER_PORT is not defined.');
        }
        return `http://${host}:${parseInt(port, 10)}`;
    }

    public static get ACTION_URL(): string {
        const host = process.env.ACTION_HOST;
        const port = process.env.ACTION_PORT;
        if (!host || !port) {
            throw new Error('ACTION_HOST or ACTION_PORT is not defined.');
        }
        return `http://${host}:${parseInt(port, 10)}`;
    }

    // PostgreSQL configuration
    public static readonly DATABASE_HOST = process.env.DATABASE_HOST || 'localhost';
    public static readonly DATABASE_PORT = parseInt(process.env.DATABASE_PORT || '5432', 10);
    public static readonly DATABASE_NAME = process.env.DATABASE_NAME || 'openslides';
    public static readonly DATABASE_USER = process.env.DATABASE_USER || 'openslides';
    public static readonly DATABASE_PASSWORD_FILE =
        process.env.DATABASE_PASSWORD_FILE || '/run/secrets/postgres_password';

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
