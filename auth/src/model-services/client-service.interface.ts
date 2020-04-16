import Client from '../core/models/client';
import { InjectableClass } from '../core/modules/decorators/injectable';

export class ClientServiceInterface extends InjectableClass {
    create: (username: string, password: string) => Promise<Client>;
    getClientByCredentials: (username: string, password: string) => Promise<Client>;
    getClientBySessionId: (sessionId: string) => Promise<Client>;
    hasClient: (username: string, password: string) => Promise<boolean>;
}
