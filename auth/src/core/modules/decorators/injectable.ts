import Container from '../di/container';
import { Type } from './utils';

export class InjectableClass {
    public name: string;
}

export function Constructable(key: any): any {
    return (target: Type<any>) => {
        Container.getInstance().register(key, target);
        return Reflect.defineMetadata('design:paramtypes', key, target);
    };
}
