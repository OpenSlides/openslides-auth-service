import Dependency from './dependency';
import Provider from './provider';

export default class Container {
    private static instance: Container;

    private readonly registry = new Map<Dependency<any>, Provider<any>>();
    private readonly registerMap = new Map<string, Dependency<any>>();

    private constructor() {}

    public static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    public register<T>(dependency: Dependency<T>, provider: Provider<T>): this {
        if (!this.registry.get(dependency)) {
            this.registry.set(dependency, provider);
        }
        return this;
    }

    public get<T>(dependency: new () => T): T {
        const provider = this.registry.get(dependency);
        if (provider) {
            return provider(this);
        } else {
            const item = new dependency();
            this.registry.set(dependency, () => item);
            return item;
        }
    }

    // public registerString<T>(key: string, dependency: Dependency<T>): this {
    //     if (!this.registerMap.get(key)) {
    //         this.registerMap.set(key, dependency);
    //     }
    //     return this;
    // }

    // public getString<T>(key: string): Dependency<T> | undefined {
    //     const provider = this.registerMap.get(key);
    //     return provider;
    // }
}
