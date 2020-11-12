export abstract class BaseException {
    public readonly message: string;

    public constructor(message: string) {
        this.message = message;
    }
}
