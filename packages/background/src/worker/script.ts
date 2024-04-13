import { parentPort, workerData } from 'node:worker_threads';
import { type Message, postMessage } from '../message';

postMessage(parentPort, { type: 'state', state: 'ready' });

parentPort?.on('message', async (message: Message) => {
  if (message.type !== 'call') {
    return;
  }

  postMessage(parentPort, { type: 'state', state: 'working' });

  try {
    const mod = await import(message.job.file);
    let exported = mod[message.job.name];
    if (!exported) {
      postMessage(parentPort, {
        type: 'call_error',
        error: new Error(
          `Unable to find ${message.job.name} in ${message.job.file}`,
        ),
      });
      return;
    }

    const fn = message.job.method ? exported[message.job.method] : exported;
    if (!fn) {
      postMessage(parentPort, {
        type: 'call_error',
        error: new Error(
          `Unable to find ${message.job.name}.${message.job.method} in ${message.job.file}`,
        ),
      });
      return;
    }

    console.log(
      '[Worker#%s] Running %s in %s',
      workerData.workerId,
      message.job.method
        ? `${message.job.name}.${message.job.method}`
        : message.job.name,
      message.job.file,
    );
    // console.log(
    // 'Running %s in %s with args: %s',
    // message.job.method
    // ? `${message.job.name}.${message.job.method}`
    // : message.job.name,
    // message.job.file,
    // message.job.args,
    // );

    const result = await fn(...message.job.args);
    postMessage(parentPort, { type: 'call_result', result });
  } catch (error) {
    postMessage(parentPort, {
      type: 'call_error',
      error: error instanceof Error ? error : new Error(`${error}`),
    });
  } finally {
    postMessage(parentPort, { type: 'state', state: 'ready' });
  }
});
