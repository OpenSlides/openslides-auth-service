export type ClassDecorator<T> = (target: T) => void;

export interface Type<T> {
    new (...args: any[]): T;
    prototype: any;
    name: string;
}
