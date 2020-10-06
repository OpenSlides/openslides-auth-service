export type ClassDecorator<T> = (target: T) => void;

export interface Type<T> {
    prototype: any;
    name: string;
    new (...args: any[]): T;
}
