// import 'reflect-metadata';

import Container from '../di/container';
import { Type } from './service';

// export function Inject<T extends new (...args: any[]) => {}>(constructor?: T): any {
//     console.log('calls Inject');
//     console.log('constructor', constructor);
//     if (constructor) {
//         return Container.getInstance().get(constructor);
//     } else {
//         // return function(target: any): any {
//         //     Reflect.getMetaData()
//         // }
//         return null;
//     }
// }

// export function Inject<T>(key: Type<T>): any {
//     const c = (target: object, propertyKey: string | symbol, descriptor?: PropertyDescriptor): T => {
//         console.log('target', target);
//         console.log('key', key);
//         console.log('propertyKey', propertyKey);
//         console.log('paramInx', descriptor);
//         // const paramTypes = Reflect.getMetadata('design:paramtypes', target);
//         // console.log('paramTypes', paramTypes);
//         // console.log('property:', Container.getInstance().get(key));
//         // if (!key) {
//         //     // const instance = Reflect.getMetadata('design:paramtypes', target);
//         //     // console.log('instance', instance);
//         // } else {
//         //     return Container.getInstance().get(key);
//         // }
//         return Container.getInstance().get(key);
//     };
//     console.log('returnValue', c);
//     return c;
//     // return Container.getInstance().get(key);
// }

export function Inject<T>(key: any): any {
    const c = (target: object, propertyKey: string | symbol, descriptor?: PropertyDescriptor): T | undefined => {
        console.log('target', target);
        console.log('key', key);
        console.log('propertyKey', propertyKey);
        console.log('paramInx', descriptor);
        // const paramTypes = Reflect.getMetadata('design:paramtypes', target);
        // console.log('paramTypes', paramTypes);
        // console.log('property:', Container.getInstance().get(key));
        // if (!key) {
        //     // const instance = Reflect.getMetadata('design:paramtypes', target);
        //     // console.log('instance', instance);
        // } else {
        //     return Container.getInstance().get(key);
        // }
        return Container.getInstance().get(key) as T;
    };
    console.log('returnValue', c);
    return c;
    // return Container.getInstance().get(key);
}

// resolving instances
// export const Inject = (target: Type<any>): any => {
//     console.log('target', target);
//     return (obj: object, property: string, descriptor: PropertyDescriptor) => {
//         // const tokens = Reflect.getMetadata('design:paramtypes', obj) || [];
//         // const injections = tokens.map((token: any) => Inject(token));
//         // console.log('tokens', tokens);
//         console.log('obj', obj);
//         console.log('property', property);
//         console.log('descriptor', descriptor);
//         // return new target(...injections);
//         return Container.getInstance().get(target);
//     };
//     // return Container.getInstance().get(target);
//     // tokens are required dependencies, while injections are resolved tokens from the Injector
// };
