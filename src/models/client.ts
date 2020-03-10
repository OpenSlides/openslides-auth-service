export default class Client {
    private pClientId: string;
    private pClientSecret: string;

    public get clientId(): string {
        return this.pClientId;
    }
    public get clientSecret(): string {
        return this.pClientSecret;
    }
    private redirectUris: string[];
    private scope: string;
}
