export abstract class Database {
    /**
     * Function to get all stored keys for a given prefix.
     *
     * @param prefix The known name for the storage of the requested objects.
     *
     * @returns A list with all found keys.
     */
    public abstract keys(prefix: string): Promise<string[]>;

    /**
     * Function to write a key/value-pair to the database. If the key is already existing, it will do nothing.
     *
     * @param prefix The known name for the storage of the requested objects.
     * @param key The key, where the object is found.
     * @param obj The object to store.
     *
     * @returns A boolean, if everything is okay - if `false`, the key is already existing in the database.
     */
    public abstract set<T>(prefix: string, key: string, obj: T): Promise<boolean>;

    /**
     * This returns an object stored by the given key.
     *
     * @param prefix The known name for the storage of the requested objects.
     * @param key The key, where the object will be found.
     *
     * @returns The object - if there is no object stored by this key, it will return an empty object.
     */
    public abstract get<T>(prefix: string, key: string): Promise<T | null>;

    /**
     * Function to get all objects from the database stored by a specific prefix.
     *
     * @param prefix The known name for the storage of the requested objects.
     *
     * @returns An array with all found objects for the specific prefix.
     */
    public abstract getAll<T>(prefix: string): Promise<T[]>;

    /**
     * This will delete an entry from the database.
     *
     * @param prefix The known name for the storage of the requested objects.
     * @param key The key of the related object to remove.
     *
     * @returns A boolean if the object was successfully deleted.
     */
    public abstract remove(prefix: string, key: string): Promise<boolean>;

    /**
     * Function to get a list with all objects containing a specified value.
     *
     * @param prefix The prefix for a specific
     * @param value The value this function will look for.
     *
     * @returns A list containing all keys, whose value matches the given value.
     */
    public abstract findAllByValue(prefix: string, value: string): Promise<string[]>;

    /**
     * Function to remove a list of keys from database, which match a given function.
     *
     * @param prefix The known name for the storage of the requested objects.
     * @param fn A function, that is called to determine, if a key should be removed.
     *
     * @returns A boolean, if the operation was successful.
     */
    public abstract removeAllByFn(prefix: string, fn: (key: string, value: string) => boolean): Promise<boolean>;
}
