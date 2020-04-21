import * as express from 'express';

import { Inject } from '../../core/modules/decorators';
import RouteHandler from '../services/route-handler';
import { RouteHandlerInterface } from '../interfaces/route-handler-interface';
import TokenValidator from '../services/token-validator';
import { Validator } from '../interfaces/validator';

export default class Routes {
    private readonly SECURE_URL_PREFIX = '/api';

    @Inject(Validator)
    private tokenValidator: TokenValidator;

    @Inject(RouteHandlerInterface)
    private routeHandler: RouteHandler;

    private app: express.Application;

    public constructor(app: express.Application) {
        this.app = app;
    }

    public initRoutes(): void {
        this.configRoutes();
        this.initPublicRoutes();
        this.initApiRoutes();
    }

    private configRoutes(): void {
        this.app.all(`${this.SECURE_URL_PREFIX}/*`, this.tokenValidator.validateToken, (hello, world, next) => {
            next();
        });
    }

    private initPublicRoutes(): void {
        this.app.post('/login', (request, response) => this.routeHandler.login(request, response)); // Sends token
        this.app.get('/', this.routeHandler.index);
        this.app.all('*', this.routeHandler.notFound);
    }

    private initApiRoutes(): void {
        this.app.get(this.getSecureUrl('/hello'), this.routeHandler.secureIndex);
        this.app.post(this.getSecureUrl('/logout'));
        this.app.get(this.getSecureUrl('/list-sessions'));
        this.app.post(this.getSecureUrl('/clear-all-sessions-except-themselves'));
        this.app.delete(this.getSecureUrl('/clear-session-by-id'));
        this.app.get(this.getSecureUrl('/who-am-i'), this.routeHandler.whoAmI);
    }

    private getSecureUrl(urlPath: string): string {
        return `${this.SECURE_URL_PREFIX}${urlPath}`;
    }
}
