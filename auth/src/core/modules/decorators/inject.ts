import Container from '../di/container';
import { Type } from './utils';

export function Inject<T>(key: any, input?: any): any {
    return (target: Type<T>, propertyKey: string | symbol, descriptor?: PropertyDescriptor): T => {
        const service = Container.getInstance().get<T>(key, input);
        Reflect.set(target, propertyKey, service);
        return {} as T;
    };
}
