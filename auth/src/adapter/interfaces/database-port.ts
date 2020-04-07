import Client from '../../core/models/client';
import { InjectableClass } from '../../core/modules/decorators';

export default interface IDatabasePort {
    // getClientByName(name: string): Client;
    // getClientById(id: string): Client;
    // addClient(sessionId: string, clientId: string): boolean;
    // removeClient(sessionId: string): void;
    // updateClient(clientId: string, client: Partial<Client>): boolean;
    // getSessionIdByClientId(clientId: string): string;
}

export class DatabasePort extends InjectableClass {
    set: <T>(key: string, obj: T) => Promise<boolean>;
    get: <T>(key: string) => Promise<T>;
    update: <T>(key: string, update: Partial<T>) => Promise<T>;
    remove: (key: string) => Promise<boolean>;
}
