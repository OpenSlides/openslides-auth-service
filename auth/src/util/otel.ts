export const makeSpan = <F extends () => ReturnType<F>>(name: string, fn: F): ReturnType<F> => fn();
