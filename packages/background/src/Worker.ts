import { EventEmitter, once } from 'node:events';
import { Worker as NodeWorker } from 'node:worker_threads';
import { v4 as uuid } from 'uuid';
import type { JobCall } from './Job';
import { type Message, postMessage } from './message';

export type WorkerState = 'starting' | 'ready' | 'pending' | 'working';
type WorkerEventMap = {
  // WorkerState
  starting: [];
  ready: [];
  pending: [];
  working: [];
  state: [state: WorkerState];

  // Result
  result: [error?: Error, result?: any];
};

export class Worker extends EventEmitter<WorkerEventMap> {
  static create() {
    return new Worker();
  }

  id: string;
  #state: WorkerState = 'starting';
  worker: NodeWorker;

  constructor() {
    super();

    this.id = uuid();
    this.state = 'starting';

    this.worker = new NodeWorker(
      new URL('./worker/script.js', import.meta.url),
      {
        name: this.id,
        workerData: {
          workerId: this.id,
        },
      },
    );

    this.worker.on('message', (message: Message) => {
      if (message.type === 'state') {
        this.state = message.state;
      } else if (message.type === 'call_result') {
        this.emit('result', undefined, message.result);
      } else if (message.type === 'call_error') {
        this.emit('result', message.error);
      }
    });
  }

  get state() {
    return this.#state;
  }

  set state(newState: WorkerState) {
    this.#state = newState;
    this.emit(this.state);
    this.emit('state', this.state);
  }

  call<A, R>(job: JobCall<A, R>): Promise<R> {
    if (this.state !== 'ready') {
      throw new Error('Worker is not ready');
    }

    this.state = 'pending';

    postMessage(this.worker, {
      type: 'call',
      job,
    });

    return new Promise((resolve, reject) => {
      return once(this, 'result').then(([error, result]) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }, reject);
    });
  }

  terminate() {
    return this.worker.terminate();
  }
}
