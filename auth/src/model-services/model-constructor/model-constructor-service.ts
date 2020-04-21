import { Constructable, Type } from '../../core/modules/decorators';
import { ModelConstructorInterface } from './model-constructor-interface';
import { Modules } from '../modules';

// @Modules.register
@Constructable(ModelConstructorInterface)
export class ModelConstructorService implements ModelConstructorInterface {
    public name = 'ModelConstructorService';
    private modelMap = new Map<string, Type<any>>();

    public constructor() {
        console.log('construct modelconstructor');
    }

    public define<T>(collection: string, modelConstructor: Type<T>): void {
        this.modelMap.set(collection, modelConstructor);
        console.log('define', this.modelMap);
    }

    public getModelConstructor<T>(collection: string): Type<T> | undefined {
        console.log('getModel', this.modelMap);
        return this.modelMap.get(collection);
    }
}
