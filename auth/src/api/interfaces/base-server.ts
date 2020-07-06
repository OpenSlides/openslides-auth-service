import * as http from 'http';

import { InjectableClass } from '../../util/di';

export abstract class BaseServer extends InjectableClass {
    public abstract getServer: () => http.Server;
    public abstract getApp: () => Express.Application;
}
