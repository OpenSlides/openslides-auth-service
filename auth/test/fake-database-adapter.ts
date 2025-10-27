import { DatabaseEvent } from '../src/api/interfaces/database';
import { DatabaseAdapter } from '../src/adapter/database-adapter';
import { FakePostgreAdapter } from './fake-postgre-adapter';
import { FAKE_ADMIN_ID } from './fake-user';
import { Id } from '../src/core/key-transforms';
import { User } from '../src/core/models/user';
import { BaseModel } from '../src/core/base/base-model';

export class FakeDatabaseAdapter {
    private database = new DatabaseAdapter();

    // private data: {[key:string]: BaseModel} = {}

    public constructor(private readonly _postgre: FakePostgreAdapter) {}

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

    public async get<T extends BaseModel>(collection: string, id: Id): Promise<T> {
        return await this.database.get<T>(collection, id);
    }

    public async write(events: DatabaseEvent[]): Promise<void> {
        await this.database.write({
            user_id: FAKE_ADMIN_ID,
            information: {},
            locked_fields: {},
            events
        });
    }

    public async closeConnection(): Promise<void> {
        await this._postgre.closeConnection();
    }


    // public async isReady(): Promise<boolean> {
    //     return true;
    // }

    // public async prune(): Promise<void> {
    //     this.data = {};
    // }

    // public async get<T extends BaseModel>(collection: string, id: Id): Promise<T> {
    //     return this.data[`${collection}/${id}`] as T
    // }

    // public async write(events: DatabaseEvent[]): Promise<void> {
    //     for (let event of events) {
    //         switch (event.type) {
    //             case EventType.CREATE:
    //                 this.data[event.fqid] = event.fields;
    //                 break;
    //             case EventType.UPDATE:
    //                 Object.assign(this.data[event.fqid], event.fields);
    //                 break;
    //             case EventType.DELETE:
    //                 delete this.data[event.fqid];
    //         }
    //     }
    // }

    // public async closeConnection(): Promise<void> {
    //     return
    // }
}
