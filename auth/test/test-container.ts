import { FakeDatastoreAdapter } from './fake-datastore-adapter';
import { FakeHttpService } from './fake-http-service';
import { FakePostgreAdapter } from './fake-postgre-adapter';
import { FakeRedisAdapter } from './fake-redis-adapter';
import { FakeRequest } from './fake-request';
import { FakeTicketService } from './fake-ticket-service';
import { FakeUser } from './fake-user';
import { FakeUserService } from './fake-user-service';

export class TestContainer {
    public readonly redis: FakeRedisAdapter;
    public readonly user: FakeUser;
    public readonly userService: FakeUserService;
    public readonly request: FakeRequest;
    public readonly http: FakeHttpService;
    public readonly datastore: FakeDatastoreAdapter;
    public readonly ticketService: FakeTicketService;

    private readonly _postgre: FakePostgreAdapter;

    public constructor() {
        this._postgre = new FakePostgreAdapter();
        this.redis = new FakeRedisAdapter();
        this.http = new FakeHttpService();
        this.ticketService = new FakeTicketService();
        this.datastore = new FakeDatastoreAdapter(this._postgre);
        this.userService = new FakeUserService(this.datastore);
        this.user = this.userService.getFakeUser();
        this.request = new FakeRequest(this.userService, this.http);
    }

    public async ready(): Promise<void> {
        await this._postgre.ready();
        await this.redis.init();
        await this.userService.init();
    }

    public async end(): Promise<void> {
        this.redis.end();
        await this._postgre.closeConnection();
    }
}
