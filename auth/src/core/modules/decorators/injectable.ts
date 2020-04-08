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

export function Constructable(key: any): any {
    return (target: Type<any>) => {
        Container.getInstance().register(key, target);
        return Reflect.defineMetadata('design:paramtypes', key, target);
    };
}
