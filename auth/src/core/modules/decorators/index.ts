import { Inject } from './inject';
import { Service } from './service';

// import Container from '../di/container';

// function service<T extends new (...args: any[]) => {}>(constructor: T): any {
//     console.log('constructor', constructor);
//     // const item = class extends constructor {
//     //     container = Container.getInstance();
//     // };
//     Container.getInstance().register(constructor, () => new constructor());
// }
// // function service<T extends new (...args: any[]) => {}>(): any {
// //     console.log('hello world from here');
// // }

export { Service, Inject };
