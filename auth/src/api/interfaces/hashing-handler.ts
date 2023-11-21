export abstract class HashingHandler {
    /**
     * The length of a password hashed with SHA512.
     */
    public static readonly SHA512_HASHED_LENGTH = 152;

    /**
     * This function hashes a given value.
     *
     * @param value The value to hash.
     *
     * @returns The hashed value.
     */
    public abstract hash(value: string): Promise<string>;

    /**
     * Hashes a given value and compares it with a second one (that is already hashed).
     * `toCompare` have to be a hashed value from this service, otherwise `false` is returned.
     *
     * @param toHash a value that is hashed.
     * @param toCompare a value that is compared to the `toHash`.
     *
     * @returns If the hashed value of `toHash` is equals to `comparingValue`.
     */
    public abstract isEquals(toHash: string, toCompare: string): Promise<boolean>;

    /**
     * Checks if a given hash is deprecated and should be updated to the current hashing algorithm.
     *
     * @param hash The hash to check.
     */
    public abstract isDeprecatedHash(hash: string): boolean;
}
