import Container from '../di/container';
import { Type } from './injectable';

export function Inject<T>(key: any): any {
    // console.log('key', key);
    return (target: Type<T>, propertyKey: string | symbol, descriptor?: PropertyDescriptor): T => {
        // console.log(
        //     'paramTypes',
        //     target,
        //     propertyKey,
        //     Reflect.getMetadataKeys(target),
        //     Reflect.getMetadata('design:paramtypes', target, propertyKey)
        // );
        // console.log('reflect', Reflect.getMetadata('design:paramtypes', target));
        const service = Container.getInstance().get<T>(key);
        console.log('target', target);
        console.log('returned service', service);
        Reflect.set(target, propertyKey, service);
        return {} as T;
        // return service;
        // const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
        // const injections = tokens.map((token: any) => Inject(token));
        // console.log('tokens', tokens, injections);
        // // target[propertyKey] = service;
        // return new target(...injections);
    };
}
