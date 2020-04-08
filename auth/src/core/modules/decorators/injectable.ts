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

export function Injectable<T extends InjectableClass>(key: T): ClassDecorator<Type<object>> {
    // return (target: Type<object>) => Container.getInstance().register(key, () => new target());
    return (target: Type<object>) => Container.getInstance().register(key, target);
}

// export function Service<T extends InjectableClass>(paramTypes: T): any {
//     console.log('paramTypes', paramTypes);
//     return (target: any, propertyKey: any, ...rest: any) => {
//         console.log('target', target, propertyKey, rest);
//         Reflect.defineMetadata('design:paramtypes', paramTypes, target, propertyKey);
//         return Container.getInstance().register(propertyKey, () => new target());
//     };
// }

// export const Service = (): ClassDecorator<any> => {
//     return (target: any, ...rest: any[]) => {
//         console.log('target', target, rest);
//         // return Container.getInstance().register('hello', () => new target());
//         return Container.getInstance().register('hello', target);
//     };
// };

export const Service = (key: any): ClassDecorator<any> => {
    return (target: Type<object>) => {
        // console.log('reflection', Reflect.getMetadata('design:paramtypes', target));
        // console.log(Reflect.set())
        Container.getInstance().register(key, target);
    };
};

export const Injector = (): ClassDecorator<any> => {
    return (target: Type<object>) => {
        console.log('injector:', Reflect.getMetadata('design:paramtypes', target));
        const tokens: any[] = Reflect.getMetadata('design:paramtypes', target) || [];
        const injections = tokens.map((token: any) => Container.getInstance().get(token));
        console.log('tokens in injector', tokens, injections);
        return new target(...injections);
    };
};

@Service(Bar)
class Bar {}

@Service(Foo)
// @Injector()
class Foo {
    constructor(bar: Bar) {}

    public foo() {
        console.log('ich bin foo');
    }
}

// @Injector()
class Baz {
    constructor(foo: Foo) {
        foo.foo;
    }
}

// Reflect.defineMetadata('custom:annotation', )

export function Constructable(key: any): any {
    return (target: Type<any>) => {
        console.log('target in constructable', target);
        Container.getInstance().register(key, target);
        return Reflect.defineMetadata('design:paramtypes', key, target);
    };
    // return Reflect.metadata(types, target);
}

export function ParamTypes(...types: any): any {
    console.log('types', types);
    return (target: any, propertyKey: any) => {
        console.log('target', target, propertyKey);
        const symParamTypes = Symbol.for('design:paramtypes');
        console.log('symParamTypes', symParamTypes);
        if (propertyKey === undefined) {
            target[symParamTypes] = types;
        } else {
            const symProperties = Symbol.for('design:properties');
            console.log('symProperties', symProperties);
            let properties, property;
            if (Object.prototype.hasOwnProperty.call(target, symProperties)) {
                properties = target[symProperties];
            } else {
                properties = target[symProperties] = {};
            }
            if (Object.prototype.hasOwnProperty.call(properties, propertyKey)) {
                property = properties[propertyKey];
            } else {
                property = properties[propertyKey] = {};
            }
            property[symParamTypes] = types;
        }
    };
}
