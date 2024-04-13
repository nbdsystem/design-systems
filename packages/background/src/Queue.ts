import { v4 as uuid } from 'uuid';
import { Deferred } from './Deferred';
import type { Job, JobCall } from './Job';
import { WorkerPool } from './WorkerPool';

interface Queue {
  enqueue<A, R>(job: Job<A, R>, args: Array<A>): Promise<R>;
  clear(): Promise<void>;
}

type QueueItem<A, R> = { id: string; job: JobCall<A, R> };

export class MemoryQueue implements Queue {
  #queue: Array<QueueItem<any, any>>;
  #deferred: Map<string, Deferred<any>>;
  pool: WorkerPool;

  static create({ numWorkers }: { numWorkers: number }) {
    return new MemoryQueue(numWorkers);
  }

  constructor(numWorkers: number) {
    this.#deferred = new Map();
    this.#queue = [];
    this.pool = WorkerPool.create({ numWorkers });
    this.pool.on('ready', this.#performWork.bind(this));
  }

  enqueue<A, R>(job: Job<A, R>, args: Array<A> = []): Promise<R> {
    const id = uuid();
    const item: QueueItem<any, any> = {
      id,
      job: {
        file: job.file,
        name: job.name,
        method: job.method,
        args,
      },
    };
    const deferred = new Deferred<R>();
    this.#queue.push(item);
    this.#deferred.set(id, deferred);
    this.#performWork();

    return deferred;
  }

  #performWork() {
    if (this.#queue.length === 0) {
      return;
    }

    if (!this.pool.ready) {
      return;
    }

    const item = this.#queue.shift();
    if (!item) {
      return;
    }

    this.pool.call(item.job).then(
      (result) => {
        const deferred = this.#deferred.get(item.id);
        deferred?.resolve(result);
      },
      (error) => {
        const deferred = this.#deferred.get(item.id);
        deferred?.reject(error);
      },
    );
  }

  async clear() {
    this.#queue = [];
  }

  async shutdown() {
    await this.clear();
    await this.pool.terminate();
  }
}
