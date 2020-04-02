import Container from '../di/container';

export function Inject<T>(key: any): any {
    return (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor): T => {
        const service = Container.getInstance().get(key) as T;
        target[propertyKey] = service;
        return service;
    };
}
