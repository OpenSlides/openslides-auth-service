import * as express from 'express';

import TokenGenerator from '../middleware/token-generator';
import TokenValidator from '../middleware/token-validator';

export default class Routes {
    private readonly SECURE_URL_PREFIX = '/api';

    private tokenValidator = new TokenValidator();
    private tokenGenerator = new TokenGenerator();

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
        this.app.all(`${this.SECURE_URL_PREFIX}/*`, this.tokenValidator.checkToken, (hello, world, next) => {
            next();
        });
    }

    private initPublicRoutes(): void {
        // this.app.get('/', (_, response) => {
        //     response.send('Hello world');
        // });
        this.app.post('/register'); // Register a new user
        this.app.post('/login', this.tokenGenerator.login);
        this.app.post('/token'); // Receive token for OAuth2.0
        this.app.get('/', this.tokenGenerator.index);
    }

    private initApiRoutes(): void {
        this.app.get(this.getSecureUrl('/hello'), this.tokenGenerator.secureIndex);
    }

    private getSecureUrl(urlPath: string): string {
        return `${this.SECURE_URL_PREFIX}${urlPath}`;
    }

    // private getSecureUrl (urlPath: string, handler: (req: express.Request, res: express.Response) => any): void {

    // }
}
