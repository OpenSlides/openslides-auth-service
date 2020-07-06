import * as express from 'express';

import { Inject, InjectService } from '../../util/di';
import { RouteHandler } from '../interfaces/route-handler';
import RouteService from '../middleware/route-service';
import { SessionValidator } from '../middleware/session-validator';
import TokenValidator from '../middleware/token-validator';
import { Validator } from '../interfaces/validator';

export default class Routes {
    private readonly SECURE_URL_PREFIX = '/api';

    @Inject(Validator)
    private tokenValidator: TokenValidator;

    @Inject(RouteHandler)
    private routeHandler: RouteService;

    @InjectService(SessionValidator)
    private sessionValidator: SessionValidator;

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
            (request, response, next) => this.tokenValidator.validate(request, response, next),
            (request, response, next) => this.sessionValidator.validate(request, response, next),
            (request, response, next) => {
                next();
            }
        );
    }

    private initPublicRoutes(): void {
        this.app.get(this.getPublicUrl('/'), (request, response) => this.routeHandler.index(request, response));
        this.app.post(this.getPublicUrl('/login'), (request, response) => this.routeHandler.login(request, response));
        this.app.post(
            this.getPublicUrl('/who-am-i'),
            (request, response, next) => this.sessionValidator.validate(request, response, next),
            (request, response) => this.routeHandler.whoAmI(request, response)
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
        this.app.delete(this.getSecureUrl('/clear-session-by-id'), this.routeHandler.clearSessionById);
    }

    private getExternalUrlPrefix(): string {
        return 'system/auth/';
    }

    private getInternalUrlPrefix(): string {
        return 'internal/auth/';
    }

    private getPublicUrl(urlPath: string): string {
        return `${this.getExternalUrlPrefix()}${urlPath}`;
    }

    private getSecureUrl(urlPath: string): string {
        return `${this.getExternalUrlPrefix()}${this.SECURE_URL_PREFIX}${urlPath}`;
    }
}
