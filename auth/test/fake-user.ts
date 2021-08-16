export class FakeUser {
    public accessToken = '';
    public refreshId = '';

    public reset(): void {
        this.accessToken = '';
        this.refreshId = '';
    }
}
