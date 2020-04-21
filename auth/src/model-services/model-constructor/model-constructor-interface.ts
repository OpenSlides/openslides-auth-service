import { InjectableClass, Type } from '../../core/modules/decorators';

export class ModelConstructorInterface extends InjectableClass {
    define: <T>(collection: string, modelConstructor: Type<T>) => void;
    getModelConstructor: <T>(collection: string) => Type<T> | undefined;
}
