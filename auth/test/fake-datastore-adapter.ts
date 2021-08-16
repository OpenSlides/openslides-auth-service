import { HttpMethod } from '../src/api/interfaces/http-handler';
import { FakeHttpService } from './fake-http-service';

export class FakeDatastoreAdapter {
    public static async updateAdmin(fields: { [key: string]: any }): Promise<void> {
        const url = `${this.getWriterUrl()}/internal/datastore/writer/write`;
        await FakeHttpService.send(url, HttpMethod.POST, {
            data: {
                user_id: 1,
                information: {},
                locked_fields: {},
                events: [{ type: 'update', fqid: 'user/1', fields }]
            }
        });
    }

    private static getWriterUrl(): string {
        const writerHost = process.env.DATASTORE_WRITER_HOST;
        const writerPort = process.env.DATASTORE_WRITER_PORT;
        if (!writerHost || !writerPort) {
            throw new Error('No datastore writer is defined.');
        }
        return `http://${writerHost}:${parseInt(writerPort, 10)}`;
    }
}
