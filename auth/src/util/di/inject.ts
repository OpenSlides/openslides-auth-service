import Container from '../di/container';
import { Type } from './utils';

export function InjectService<T>(injection: Type<T>, input?: any): any {
    return (target: Type<T>, propertyKey: string | symbol, descriptor?: PropertyDescriptor): any => {
        const service = Container.getInstance().getService<T>(injection, input);
        Reflect.set(target, propertyKey, service);
    };
}

export function Inject<T>(injection: Type<T>, ...input: any): any {
    return (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor): any => {
        const service = Container.getInstance().get<T>(injection, ...input);
        Reflect.set(target, propertyKey, service);
    };
}
