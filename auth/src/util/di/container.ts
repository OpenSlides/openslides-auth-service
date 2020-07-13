import { Type } from './';
import Dependency from './dependency';

export default class Container {
    private static instance: Container;

    private readonly registry = new Map<Dependency<any>, Type<any>>();

    private readonly serviceRegistry = new Map<Type<any>, any>();

    private constructor() {}

    public static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    public getService<T>(dependency: Type<T>, input?: any): T {
        let provider = this.serviceRegistry.get(dependency) as T;
        if (!provider) {
            provider = new dependency(input);
            this.serviceRegistry.set(dependency, provider);
        }
        return provider;
    }

    public get<T>(provider: Type<T>, input?: any): T {
        const tokens = Reflect.getMetadataKeys(provider.prototype, 'property');
        const injections = tokens.map((token: any) => this.get(token));
        return new provider(...injections, input);
    }
}
