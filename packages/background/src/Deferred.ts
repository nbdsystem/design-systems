export class Deferred<T, E = Error> implements Promise<T> {
  [Symbol.toStringTag] = 'Promise';

  promise: Promise<T>;
  #resolve!: (value: T | PromiseLike<T>) => void;
  #reject!: (reason?: E) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
    });
  }

  then<T1, T2>(
    onfulfilled?: ((value: T) => T1 | PromiseLike<T1>) | null | undefined,
    onrejected?: ((reason: E) => T2 | PromiseLike<T2>) | null | undefined,
  ): Promise<T1 | T2> {
    return Promise.prototype.then.apply(this.promise, [
      onfulfilled,
      onrejected,
    ]) as Promise<T1 | T2>;
  }

  catch<E, TResult>(
    onrejected?: (reason: E) => TResult | PromiseLike<TResult>,
  ): Promise<T | TResult> {
    return Promise.prototype.catch.apply(this.promise, [onrejected]);
  }

  finally(onfinally?: (() => void) | null | undefined): Promise<T> {
    return Promise.prototype.finally.apply(this.promise, [onfinally]);
  }

  resolve(value: T) {
    this.#resolve(value);
  }

  reject(reason: any) {
    this.#reject(reason);
  }
}
