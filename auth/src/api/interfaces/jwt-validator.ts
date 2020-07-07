export interface JwtValidator<T> {
    isValid(jwt: string): T | undefined;
}
