export interface Validation<T> {
    isValid: boolean;
    message: string;
    result?: T;
    reason?: any;
    header?: {
        token: string;
    };
}
