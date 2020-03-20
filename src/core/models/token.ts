import Client from './client';

export default interface Token {
    sessionId: string;
    clientId: string;
    client: Client;
}
