import { uuid } from 'uuidv4';

import Client from '../core/models/client';
import { ClientServiceInterface } from './client-service.interface';
import DatabaseAdapter from '../adapter/services/database-adapter';
import { DatabasePort } from '../adapter/interfaces/database-port';
import { Inject } from '../core/modules/decorators';
import { Constructable } from '../core/modules/decorators';

@Constructable(ClientServiceInterface)
export default class ClientService implements ClientServiceInterface {
    public name = 'ClientService';

    @Inject(DatabasePort)
    private database: DatabaseAdapter;

    public async create(username: string, password: string): Promise<Client> {
        const clientId = uuid();
        const client: Client = new Client(username, password, clientId);
        await this.database.set(Client.COLLECTIONSTRING, clientId, client);
        return client;
    }

    public async getClientByCredentials(username: string, password: string): Promise<Client> {
        const clients = await this.getAllClientsFromDatabase();
        const client = clients.find(c => c.username === username && c.password === password);
        if (client) {
            return client;
        } else {
            return {} as Client;
        }
    }

    public async getClientBySessionId(sessionId: string): Promise<Client> {
        const clients = await this.getAllClientsFromDatabase();
        const client = clients.find(c => c.sessionId === sessionId);
        if (client) {
            return client;
        } else {
            return {} as Client;
        }
    }

    public async hasClient(username: string, password: string): Promise<boolean> {
        const clients = await this.getAllClientsFromDatabase();
        return !!clients.find(client => client.username === username && client.password === password);
    }

    public hello(): void {
        console.log('Hello world from ClientService');
    }

    private async getAllClientsFromDatabase(): Promise<Client[]> {
        return this.database.getAll(Client.COLLECTIONSTRING);
    }
}
