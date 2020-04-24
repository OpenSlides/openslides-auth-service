export namespace Modules {
    interface Constructor<T> {
        new (...args: any[]): T;
        readonly prototype: T;
    }
    const implementations: Constructor<any>[] = [];
    export function getImplementations(): Constructor<any>[] {
        return implementations;
    }
    export function register<T extends Constructor<any>>(ctor: T): T {
        console.log('register is called', ctor);
        implementations.push(ctor);
        return ctor;
    }
}
