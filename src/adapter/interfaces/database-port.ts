import Client from 'src/core/models/client';

export default interface IDatabasePort {
    getClientByName(name: string): Client;
    getClientById(id: string): Client;
    addClient(sessionId: string, clientId: string): boolean;
    removeClient(sessionId: string): void;
    updateClient(clientId: string, client: any): boolean;
    getSessionIdByClientId(clientId: string): string;
}
