export interface Validation<T> {
    isValid: boolean;
    message: string;
    result?: T;
}
