import * as http from 'http';

import { InjectableClass } from '../../core/modules/decorators';

export default class BaseServer extends InjectableClass {
    getServer: () => http.Server;
    getApp: () => Express.Application;
}
