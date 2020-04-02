import Client from '../../core/models/client';
import { InjectableClass } from '../../core/modules/decorators';

export default interface IDatabasePort {
    getClientByName(name: string): Client;
    getClientById(id: string): Client;
    addClient(sessionId: string, clientId: string): boolean;
    removeClient(sessionId: string): void;
    updateClient(clientId: string, client: any): boolean;
    getSessionIdByClientId(clientId: string): string;
}

export class DatabasePort extends InjectableClass {
    getClientByName: (name: string) => Promise<Client>;
    addClient: (client: object) => void;
}
