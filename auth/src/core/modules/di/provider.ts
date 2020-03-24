import Container from './container';

type Provider<T> = (container: Container) => T;

export default Provider;
