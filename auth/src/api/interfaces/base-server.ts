import * as http from 'http';

import { InjectableClass } from '../../core/modules/decorators';

export default class BaseServer extends InjectableClass {
    public getServer: () => http.Server;
    public getApp: () => Express.Application;
}
