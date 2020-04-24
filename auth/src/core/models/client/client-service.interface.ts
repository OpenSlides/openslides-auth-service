import Client from './client';
import { InjectableClass } from '../../modules/decorators/injectable';

export class ClientServiceInterface extends InjectableClass {
    public create: (username: string, password: string) => Promise<Client>;
    public getClientByCredentials: (username: string, password: string) => Promise<Client | undefined>;
    public getClientBySessionId: (sessionId: string) => Promise<Client | undefined>;
    public hasClient: (username: string, password: string) => Promise<boolean>;
    public getAllClients: () => Client[];
}
