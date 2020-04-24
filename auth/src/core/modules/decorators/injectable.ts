import Container from '../di/container';
import { Type } from './utils';

export class InjectableClass {
    public name: string;
}

export function Constructable(key: any): any {
    return (target: Type<any>) => {
        console.log('constructable', target, Reflect.getMetadata('design:paramtypes', target));
        Container.getInstance().register(key, target);
        const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
        tokens.map((token: any) => console.log('container', Container.getInstance().get(token)));
        return Reflect.defineMetadata('design:paramtypes', key, target);
    };
}
