import Container from '../di/container';
import { Type } from './injectable';

export function Inject<T>(key: any): any {
    return (target: Type<T>, propertyKey: string | symbol, descriptor?: PropertyDescriptor): T => {
        const service = Container.getInstance().get<T>(key);
        Reflect.set(target, propertyKey, service);
        return {} as T;
    };
}
