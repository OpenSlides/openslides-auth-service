export type BaseModelType = Record<string, unknown>;

export abstract class BaseModel<T extends BaseModelType = BaseModelType> {
    public static readonly COLLECTION: string;

    public constructor(input?: Partial<T>) {
        if (input) {
            Object.assign(this, input);
        }
    }
}
