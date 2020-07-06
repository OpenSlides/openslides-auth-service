import Container from '../di/container';
import { Type } from './utils';

export function InjectService<T>(key: Type<T>, input?: any): any {
    return (target: Type<T>, propertyKey: string | symbol, descriptor?: PropertyDescriptor): any => {
        const service = Container.getInstance().getService<T>(key, input);
        Reflect.set(target, propertyKey, service);
    };
}

export function Inject<T>(key: any, input?: any): any {
    return (target: Type<T>, propertyKey: string | symbol, descriptor?: PropertyDescriptor): any => {
        const service = Container.getInstance().get<T>(key, input);
        Reflect.set(target, propertyKey, service);
    };
}
