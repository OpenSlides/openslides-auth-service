import Container from '../di/container';

export type ClassDecorator<T> = (target: T) => void;

export interface Type<T> {
    new (...args: any[]): T;
    prototype: any;
    name: string;
}

export class InjectableClass {
    name: string;
}

export function Injectable<T extends InjectableClass, V>(key: T): ClassDecorator<Type<object>> {
    return (target: Type<object>) => Container.getInstance().register(key, () => new target());
}
