import Container from '../di/container';

function service<T extends new (...args: any[]) => {}>(constructor: T): any {
    console.log('constructor', constructor);
    const item = class extends constructor {
        container = Container.getInstance();
    };
    Container.getInstance().register(constructor, () => item);
    return item;
}

export { service };
