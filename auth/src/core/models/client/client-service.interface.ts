import Client from './client';
import { InjectableClass } from '../../modules/decorators/injectable';

export class ClientServiceInterface extends InjectableClass {
    create: (username: string, password: string) => Promise<Client>;
    getClientByCredentials: (username: string, password: string) => Promise<Client | undefined>;
    getClientBySessionId: (sessionId: string) => Promise<Client | undefined>;
    hasClient: (username: string, password: string) => Promise<boolean>;
    getAllClients: () => Promise<Client[]>;
}
