import Container from '../di/container';
import { Type } from './utils';

export class InjectableClass {
    public name: string;
}

export function Constructable(key: any): any {
    return (target: Type<any>) => {
        // const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
        // const services = tokens.map((token: Type<any>) => Container.getInstance().getService(token));
        // target.services = services;
        Container.getInstance().register(key, target);
        return Reflect.defineMetadata('design:paramtypes', key, target);
    };
}
