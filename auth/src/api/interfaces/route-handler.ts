import express from 'express';

export interface HttpData {
    [key: string]: any;
}

export abstract class RouteHandler {
    /**
     * Function to test connectivity to auth-service
     *
     * @param response HttpResponse
     */
    public abstract index(request: express.Request, response: express.Response): void;
    /**
     * Function to test an api connection.
     *
     * @param response HttpResponse
     */
    public abstract apiIndex(request: express.Request, response: express.Response): void;

    /**
     * Function to send back { userId, sessionId } after validating current access-token.
     *
     * @param response HttpResponse
     */
    public abstract authenticate(request: express.Request, response: express.Response): void;
    public abstract notFound(request: express.Request, response: express.Response): Promise<void>;

    public abstract login(request: express.Request, response: express.Response): Promise<void>;
    public abstract whoAmI(request: express.Request, response: express.Response): Promise<void>;
    public abstract logout(request: express.Request, response: express.Response): void;
    public abstract getListOfSessions(request: express.Request, response: express.Response): Promise<void>;
    public abstract clearUserSessionByUserId(request: express.Request, response: express.Response): void;
    public abstract clearAllSessionsExceptThemselves(request: express.Request, response: express.Response): void;
    public abstract hash(request: express.Request, response: express.Response): void;
}
