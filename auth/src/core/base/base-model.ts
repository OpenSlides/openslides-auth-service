import { Collection } from './collection';

export abstract class BaseModel<T = any> implements Collection {
    protected constructor(public readonly collectionString: string, input?: Partial<T>) {
        this.assign(input);
    }

    /**
     * Assigns given properties to the underlying model itself.
     *
     * @param input Any properties of the sub-model.
     *
     * @returns The resulted model.
     */
    private assign(input?: Partial<T>): T {
        return Object.assign(this, input) as T;
    }
}
