import { HttpMethod } from '../src/api/interfaces/http-handler';
import { FakeHttpService } from './fake-http-service';
import { FakePostgreAdapter } from './fake-postgre-adapter';
import { FAKE_ADMIN_ID } from './fake-user';

export enum EventType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete'
}

abstract class Event {
    fqid: string;
    abstract type: EventType;
}

class CreateEvent<T> extends Event {
    type: EventType.CREATE;
    fields: { [key in keyof T]?: unknown };
}

class UpdateEvent<T> extends Event {
    type: EventType.UPDATE;
    fields: { [key in keyof T]?: unknown };
}

class DeleteEvent extends Event {
    type: EventType.DELETE;
}

type DatastoreEvent<T = any> = CreateEvent<T> | UpdateEvent<T> | DeleteEvent;

class DatastoreSchema {
    user_id: number;
    locked_fields: object;
    information: object;
    events: DatastoreEvent[];
}

export class FakeDatastoreAdapter {
    public constructor(private readonly _postgre: FakePostgreAdapter, private readonly _http: FakeHttpService) {}

    public async isReady(): Promise<boolean> {
        try {
            await this._postgre.ready();
            return true;
        } catch (e) {
            return false;
        }
    }

    public async prune(): Promise<void> {
        await this._postgre.prune();
    }

    public async write<T>(events: DatastoreEvent[]): Promise<T> {
        const url = this.getWriterUrl();
        const answer = await this._http.send<T, DatastoreSchema>(url, HttpMethod.POST, {
            data: {
                user_id: FAKE_ADMIN_ID,
                information: {},
                locked_fields: {},
                events
            }
        });
        return answer;
    }

    public async closeConnection(): Promise<void> {
        await this._postgre.closeConnection();
    }

    private getWriterUrl(): string {
        const writerHost = process.env.DATASTORE_WRITER_HOST;
        const writerPort = process.env.DATASTORE_WRITER_PORT;
        if (!writerHost || !writerPort) {
            throw new Error('No datastore writer is defined.');
        }
        return `http://${writerHost}:${parseInt(writerPort, 10)}/internal/datastore/writer/write`;
    }
}
