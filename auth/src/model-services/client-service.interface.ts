import Client from '../core/models/client';
import { InjectableClass } from '../core/modules/decorators/injectable';

export class ClientServiceInterface extends InjectableClass {
    create: (username: string, password: string) => Client;
}
