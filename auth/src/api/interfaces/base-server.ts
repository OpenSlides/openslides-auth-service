import * as http from 'http';
import { InjectableClass } from 'src/core/modules/decorators';

export default class BaseServer extends InjectableClass {
    getServer: () => http.Server;
    getApp: () => Express.Application;
}
