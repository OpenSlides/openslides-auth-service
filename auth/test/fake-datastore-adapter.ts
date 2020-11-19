import request from 'superagent';

export namespace FakeDatastoreAdapter {
    function getWriterUrl(): string {
        const writerHost = process.env.DATASTORE_WRITER_HOST;
        const writerPort = process.env.DATASTORE_WRITER_PORT;
        if (!writerHost || !writerPort) {
            throw new Error('No datastore writer is defined.');
        }
        return `http://${writerHost}:${parseInt(writerPort, 10)}`;
    }

    export async function updateAdmin(fields: { [key: string]: any }): Promise<void> {
        const url = `${getWriterUrl()}/internal/datastore/writer/write`;
        await request
            .post(url)
            .set({
                'Content-Type': 'application/json',
                Accept: 'application/json'
            })
            .send({
                user_id: 1,
                information: {},
                locked_fields: {},
                events: [{ type: 'update', fqid: 'user/1', fields }]
            });
    }
}
