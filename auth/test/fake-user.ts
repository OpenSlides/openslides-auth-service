export const FAKE_ADMIN_ID = 1;

export class FakeUser {
    public accessToken = '';
    public refreshId = '';

    public reset(): void {
        this.accessToken = '';
        this.refreshId = '';
    }
}
