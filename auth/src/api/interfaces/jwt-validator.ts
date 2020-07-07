export interface Validation<T> {
    isValid: boolean;
    message: string;
    result?: T;
}

export interface JwtValidator<T> {
    isValid(jwt: string): Validation<T>;
}
