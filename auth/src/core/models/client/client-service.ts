import { uuid } from 'uuidv4';

import Client from './client';
import { ClientServiceInterface } from './client-service.interface';
import DatabaseAdapter from '../../../adapter/services/database-adapter';
import { DatabasePort } from '../../../adapter/interfaces/database-port';
import { Constructable, Inject } from '../../modules/decorators';

@Constructable(ClientServiceInterface)
export default class ClientService implements ClientServiceInterface {
    public name = 'ClientService';

    @Inject(DatabasePort, Client)
    private database: DatabaseAdapter;

    private clientCollection: Map<string, Client> = new Map();

    public constructor() {
        this.getAllClientsFromDatabase().then(clients => this.initClientCollection(clients));
    }

    public async create(username: string, password: string): Promise<Client> {
        const clientId = uuid();
        const client: Client = new Client({ username, password, clientId });
        const done = await this.database.set(Client.COLLECTIONSTRING, clientId, client);
        if (done) {
            this.clientCollection.set(clientId, client);
        }
        return client;
    }

    public async getClientByCredentials(username: string, password: string): Promise<Client | undefined> {
        const clients = this.getAllClients();
        return clients.find(c => c.username === username && c.password === password);
    }

    public async getClientBySessionId(sessionId: string): Promise<Client | undefined> {
        const clients = this.getAllClients();
        return clients.find(c => c.sessionId === sessionId);
    }

    public async hasClient(username: string, password: string): Promise<boolean> {
        const clients = this.getAllClients();
        return !!clients.find(client => client.username === username && client.password === password);
    }

    public getAllClients(): Client[] {
        return Array.from(this.clientCollection.values());
    }

    private async getAllClientsFromDatabase(): Promise<Client[]> {
        return await this.database.getAll(Client.COLLECTIONSTRING);
    }

    private initClientCollection(clients: Client[]): void {
        for (const client of clients) {
            this.clientCollection.set(client.clientId, client);
        }
    }
}
