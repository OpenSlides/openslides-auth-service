import Container from '../di/container';

// export function Service<T extends new (...args: any[]) => {}>(constructor: T): any {
//     console.log('calls Service');
//     Container.getInstance().register(constructor, () => new constructor());
// }

export type ClassDecorator<T> = (target: T) => void;

// export interface IClass<T> {
//     new (...args: any[]): T;
//     prototype: any;
//     name: string;
// }

// export function Service(): any {
//     return function<T extends IClass<any>>(constructorFunction: T): any {
//         const injectedClass = class C extends constructorFunction {
//             constructor(...args: any[]) {
//                 super(...args);
//             }
//         };
//         (injectedClass as any).originalConstructor = constructorFunction;
//         return injectedClass;
//     };
// }

export interface Type<T> {
    new (...args: any[]): T;
    prototype: any;
    name: string;
}

export const Service = (key: any): ClassDecorator<Type<object>> => {
    return (target: Type<object>) => {
        Container.getInstance().register(key, () => new target());
    };
};

// export function Service(): ClassDecorator<Type<object>> {
//     // return <T extends Type<any>>(target: T) => {
//     //     const injectedClass = class C extends target {
//     //         constructor(...args: any[]) {
//     //             super(...args);
//     //         }
//     //     };
//     //     (injectedClass as any).originalConstructor = target;
//     //     console.log('injectedClass', injectedClass);
//     //     // Container.getInstance().register(target, () => new injectedClass());
//     //     const instance = new injectedClass();
//     //     Container.getInstance().register(target, instance);
//     //     return injectedClass;
//     // };
//     return (target: Type<object>) => {
//         const instance = new target();
//         Container.getInstance().register(target, () => new target());
//         return instance;
//     };
// }
