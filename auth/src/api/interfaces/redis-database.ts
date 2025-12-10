import { Id } from 'src/core/key-transforms';

export type KeyType = Id | string;

export abstract class RedisDatabase {
    public static readonly PREFIX = 'auth';

    /**
     * Function to get all stored keys for a given prefix.
     *
     * @returns A list with all found keys.
     */
    public abstract keys(): Promise<string[]>;

    /**
     * Function to write a key/value-pair to the database. If the key is already existing, it will do nothing.
     *
     * @param key The key, where the object is found.
     * @param obj The object to store.
     * @param expire Optional: If true, the key expires after PASSWORD_RESET_TOKEN_EXPIRATION_TIME. If false,
     * the key is added to the index set.
     *
     * @returns A boolean, if everything is okay - if `false`, the key is already existing in the database.
     */
    public abstract set<T>(key: KeyType, obj: T, expire?: boolean): Promise<void>;

    /**
     * This returns an object stored by the given key.
     *
     * @param key The key, where the object will be found.
     *
     * @returns The object - if there is no object stored by this key, it will return an empty object.
     */
    public abstract get<T>(key: KeyType): Promise<T>;

    /**
     * This will delete an entry from the database.
     *
     * @param key The key of the related object to remove.
     *
     * @returns A boolean if the object was successfully deleted.
     */
    public abstract remove(key: KeyType): Promise<boolean>;
}
