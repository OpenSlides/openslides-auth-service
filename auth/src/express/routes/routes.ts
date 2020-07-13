import * as express from 'express';

import { Inject } from '../../util/di';
import { RouteHandler } from '../../api/interfaces/route-handler';
import RouteService from '../middleware/route-service';
import TicketValidator from '../middleware/ticket-validator';
import { Validator } from '../../api/interfaces/validator';

export default class Routes {
    private readonly EXTERNAL_URL_PREFIX = '/system/auth';
    private readonly INTERNAL_URL_PREFIX = '/internal/auth';
    private readonly SECURE_URL_PREFIX = '/api';

    @Inject(TicketValidator)
    private validator: Validator;

    @Inject(RouteService)
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
        this.app.all(
            this.getSecureUrl('/*'),
            (request, response, next) => this.validator.validate(request, response, next),
            (request, response, next) => {
                next();
            }
        );
    }

    private initPublicRoutes(): void {
        this.app.get(this.getPublicUrl('/'), (request, response) => this.routeHandler.index(request, response));
        this.app.post(this.getPublicUrl('/login'), (request, response) => this.routeHandler.login(request, response));
        this.app.post(this.getPublicUrl('/who-am-i'), (request, response) =>
            this.routeHandler.whoAmI(request, response)
        );
        this.app.post(`${this.getInternalUrlPrefix()}/hash`);
    }

    private initApiRoutes(): void {
        this.app.get(this.getSecureUrl('/hello'), this.routeHandler.secureIndex);
        this.app.post(this.getSecureUrl('/logout'), (request, response) => this.routeHandler.logout(request, response));
        this.app.get(this.getSecureUrl('/list-sessions'), this.routeHandler.getListOfSessions);
        this.app.post(
            this.getSecureUrl('/clear-all-sessions-except-themselves'),
            this.routeHandler.clearAllSessionsExceptThemselves
        );
        this.app.delete(this.getSecureUrl('/clear-session-by-id'), this.routeHandler.clearUserSessionByUserId);
    }

    private getExternalUrlPrefix(): string {
        return 'system/auth';
    }

    private getInternalUrlPrefix(): string {
        return 'internal/auth';
    }

    private getPublicUrl(urlPath: string): string {
        return `${this.EXTERNAL_URL_PREFIX}${urlPath}`;
    }

    private getSecureUrl(urlPath: string): string {
        return `${this.EXTERNAL_URL_PREFIX}${this.SECURE_URL_PREFIX}${urlPath}`;
    }
}
