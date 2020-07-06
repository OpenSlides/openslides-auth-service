export interface IsValid<T> {
    isValid(token: string): T | undefined;
}
