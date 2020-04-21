import { uuid } from 'uuidv4';

import Client from './client';
import { ClientServiceInterface } from './client-service.interface';
import DatabaseAdapter from '../../../adapter/services/database-adapter';
import { DatabasePort } from '../../../adapter/interfaces/database-port';
import { Constructable, Inject } from '../../modules/decorators';
import { ModelConstructorInterface, ModelConstructorService } from '../../../model-services/model-constructor';

@Constructable(ClientServiceInterface)
export default class ClientService implements ClientServiceInterface {
    public name = 'ClientService';

    @Inject(DatabasePort)
    private database: DatabaseAdapter;

    @Inject(ModelConstructorInterface)
    private modelConstructor: ModelConstructorService;

    public constructor() {
        this.modelConstructor.define(Client.COLLECTIONSTRING, Client);
    }

    public async create(username: string, password: string): Promise<Client> {
        const clientId = uuid();
        const client: Client = new Client({ username, password, clientId });
        await this.database.set(Client.COLLECTIONSTRING, clientId, client);
        return client;
    }

    public async getClientByCredentials(username: string, password: string): Promise<Client | undefined> {
        const clients = await this.getAllClientsFromDatabase();
        const client = clients.find(c => c.username === username && c.password === password);
        // const client = this.findClient(clients, c => c.username === username && c.password === password);
        console.log('client', client);
        return client;
        // return clients.find(c => c.username === username && c.password === password);
    }

    public async getClientBySessionId(sessionId: string): Promise<Client | undefined> {
        const clients = await this.getAllClientsFromDatabase();
        return clients.find(c => c.sessionId === sessionId);
    }

    public async hasClient(username: string, password: string): Promise<boolean> {
        const clients = await this.getAllClientsFromDatabase();
        return !!clients.find(client => client.username === username && client.password === password);
    }

    public async getAllClients(): Promise<Client[]> {
        return await this.database.getAll(Client.COLLECTIONSTRING);
    }

    public hello(): void {
        console.log('Hello world from ClientService');
    }

    private async getAllClientsFromDatabase(): Promise<Client[]> {
        return await this.database.getAll(Client.COLLECTIONSTRING);
    }

    private findClient(clients: Client[], condition: (client: Client) => boolean): Client | undefined {
        let result;
        for (const client of clients) {
            console.log('client', client.username);
            if (condition(client)) {
                result = client;
                break;
            }
        }
        return result;
    }
}
