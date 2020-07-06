import { InjectableClass } from '../../util/di';
import { Client } from '../../core/models/client/client';

export class ClientHandler extends InjectableClass {
    public create: (appName: string, redirectUrl: string, appDescription?: string) => Promise<Client>;
    public getClientById: (clientId: string) => Client | undefined;
    public hasClient: (clientId: string) => boolean;
    public setClientSecret: (clientId: string, clientSecret: string) => Promise<void>;
    public getAllClients: () => Client[];
}
