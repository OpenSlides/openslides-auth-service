export interface Validation<T> {
    isValid: boolean;
    message: string;
    result?: T;
}

export interface JwtValidator {
    isValid(jwt: string): boolean;
}
