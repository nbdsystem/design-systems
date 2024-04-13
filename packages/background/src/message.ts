import type { MessagePort, Worker } from 'node:worker_threads';
import type { JobCall } from './Job';

export type Message =
  | { type: 'call'; job: JobCall<any, any> }
  | { type: 'call_result'; result: any }
  | { type: 'call_error'; error: Error }
  | { type: 'state'; state: 'ready' | 'working' };

export function postMessage(
  sender: MessagePort | Worker | null,
  message: Message,
) {
  sender?.postMessage(message);
}
