export abstract class BaseModel<T=unknown> {
    public static readonly COLLECTION: string;

    public constructor(input?: Partial<T>) {
        if (input) {
            Object.assign(this, input);
        }
    }
}