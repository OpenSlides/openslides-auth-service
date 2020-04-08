import Dependency from './dependency';
import Provider from './provider';
import { Type } from '../decorators/injectable';

export default class Container {
    private static instance: Container;

    private readonly registry = new Map<Dependency<any>, Type<any>>();

    private constructor() {}

    public static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    public register<T>(dependency: Dependency<T>, provider: Type<T>): this {
        console.log('registerContainer', dependency, provider);
        this.registry.set(dependency, provider);
        // if (!this.registry.get(dependency)) {
        // }
        return this;
    }

    public get<T>(dependency: new () => T): Type<T> {
        console.log('getFromContainer', dependency, this.registry);
        const provider = this.registry.get(dependency);
        if (provider) {
            console.log('provider', provider);
            // return new provider(this);
            // return provider;
            // return provider(this) as T;
            // const tokens = Reflect.getMetadata('design:paramtypes', provider) || [];
            const tokens = Reflect.getMetadataKeys(provider.prototype, 'property');
            console.log('tokens in container', tokens);
            const injections = tokens.map((token: any) => this.get(token));
            console.log('injections', injections);
            return new provider(injections);
            // return provider;
        } else {
            return {} as Type<T>;
        }
    }
}
