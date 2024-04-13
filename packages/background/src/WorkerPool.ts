import { EventEmitter, once } from 'node:events';
import type { JobCall } from './Job';
import { Worker, type WorkerState } from './Worker';

type WorkerPoolEventMap = {
  ready: [];
};

export class WorkerPool extends EventEmitter<WorkerPoolEventMap> {
  static create({ numWorkers }: { numWorkers: number }) {
    return new WorkerPool(numWorkers);
  }

  workers: Array<Worker>;

  constructor(numWorkers: number) {
    super();

    this.workers = Array.from({ length: numWorkers }, () => {
      const worker = Worker.create();
      worker.on('state', this.onWorkerStateChange.bind(this));
      return worker;
    });
  }

  get ready() {
    const workers = this.workers.filter((worker) => {
      return worker.state === 'ready';
    });
    return workers.length > 0;
  }

  async call<A, R>(job: JobCall<A, R>): Promise<R> {
    if (!this.ready) {
      throw new Error('No workers ready');
    }

    const workers = this.workers.filter((worker) => {
      return worker.state === 'ready';
    });
    const worker = workers[random(workers.length - 1)];
    if (!worker) {
      throw new Error('Unable to get ready worker');
    }

    return worker.call(job);
  }

  onWorkerStateChange(state: WorkerState) {
    if (state === 'ready') {
      this.emit('ready');
    }
  }

  terminate() {
    return Promise.all(
      this.workers.map((worker) => {
        return worker.terminate();
      }),
    );
  }
}

function random(ceiling: number): number {
  return Math.floor(Math.random() * ceiling);
}
