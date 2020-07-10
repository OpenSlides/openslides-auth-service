export abstract class HashingHandler {
    /**
     * This function hashes a given value.
     *
     * @param value The value to hash.
     *
     * @returns The hashed value.
     */
    public abstract hash(value: string): string;
}
