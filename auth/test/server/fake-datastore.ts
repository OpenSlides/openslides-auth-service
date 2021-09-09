import { OnRequest, RestApplication, RestController, RoutingError } from 'rest-app';

@RestController({ defaultMethod: 'post' })
class FakeDatastoreReader {
    @OnRequest()
    public filter(): void {
        throw new RoutingError('Datastore unavailable', { statusCode: 500 });
    }

    @OnRequest()
    public exists(): void {
        throw new RoutingError('False', { statusCode: 404 });
    }

    @OnRequest()
    public get(): void {
        throw new RoutingError('Resource moved away', { statusCode: 302 });
    }
}

export const testServer = new RestApplication({
    shouldImmediatelyStart: true,
    controllers: [FakeDatastoreReader],
    port: 3000
});
