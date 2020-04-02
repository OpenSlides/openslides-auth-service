import Client from '../core/models/client';
import { ClientServiceInterface } from './client-service.interface';
import { Injectable } from '../core/modules/decorators/injectable';

@Injectable(ClientServiceInterface)
export default class ClientService implements ClientServiceInterface {
    public name = 'ClientService';

    private clients: Client[];

    public addClient(client: Client): boolean {
        if (!this.clients.find(entry => entry.clientId === client.clientId)) {
            this.clients.push(client);
            return true;
        }
        return false;
    }

    /**
     * @returns The found client or undefined if there is no client with the given id.
     */
    public getClientById(id: string): Client | undefined {
        return this.clients.find(client => client.clientId === id);
    }

    public hello(): void {
        console.log('Hello world from ClientService');
    }
}
