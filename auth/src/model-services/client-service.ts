import { uuid } from 'uuidv4';

import Client from '../core/models/client';
import { ClientServiceInterface } from './client-service.interface';
import DatabaseAdapter from '../adapter/services/database-adapter';
import { DatabasePort } from '../adapter/interfaces/database-port';
import { Inject } from '../core/modules/decorators';
import { Injectable, Constructable } from '../core/modules/decorators/injectable';

// @Injectable(ClientServiceInterface)
@Constructable(ClientServiceInterface)
export default class ClientService implements ClientServiceInterface {
    public name = 'ClientService';

    @Inject(DatabasePort)
    private database: DatabaseAdapter;

    public constructor(database: DatabaseAdapter) {
        console.log('construct client-service database', this.database);
        // this.database = database;
        this.create('user', 'user');
    }

    public async create(username: string, password: string): Promise<Client> {
        // if (this.database) {
        //     return {} as Client;
        // }
        console.log('create database', username);
        const clientId = uuid();
        const client: Client = new Client(username, password, clientId);
        await this.database.set(clientId, client);
        this.database.get(clientId).then(result => console.log('client', result));
        return client;
    }

    public hello(): void {
        console.log('Hello world from ClientService');
    }
}
