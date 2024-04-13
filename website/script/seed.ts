import os from 'node:os';
import { MemoryQueue } from '@nbds/background';
import { designSystems } from '@nbds/design-systems';
import { BundleSizeJob, getLatestVersion } from '../jobs/package';

const defaultNumWorkers = os.availableParallelism() - 1;

async function main() {
  const queue = MemoryQueue.create({
    numWorkers: 1,
  });
  const packages = designSystems
    .flatMap((designSystem) => {
      return designSystem.packages ?? [];
    })
    .slice(0, 1);

  try {
    const promises = [];

    for (const pkg of packages) {
      if (pkg.registry !== 'npm') {
        continue;
      }

      const version = await getLatestVersion(pkg.name);
      const promise = queue.enqueue(BundleSizeJob, [pkg.name, version]);
      promises.push(promise);
    }

    await Promise.all(promises);
  } finally {
    await queue.shutdown();
  }

  process.on('SIGINT', async () => {
    await queue.shutdown();
  });
}

main().catch((error) => {
  console.log(error);
  process.exit(1);
});
