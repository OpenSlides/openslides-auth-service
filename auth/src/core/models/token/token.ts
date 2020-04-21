import Client from '../client/client';

export default interface Token {
    sessionId: string;
    clientId: string;
    client: Client;
}
