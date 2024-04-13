import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Job } from '@nbds/background';
import { bundleSize } from '@nbds/bundlesize';
import * as time from '@nbds/cache/time';
import * as npm from '@nbds/npm';
import got from 'got';
import { extract } from 'tar';
import { cache } from './cache.js';

const CACHE_DIR = path.resolve(import.meta.dirname, '..', '.cache', 'packages');

export function getPackage(name) {
  return cache({
    namespace: 'npm',
    key: name,
    get: () => npm.getPackage(name),
    ttl: time.Day,
  });
}

export async function getPackageVersion(name, version) {
  return cache({
    namespace: 'npm',
    key: `${name}@${version}`,
    get: () => npm.getPackageVersion(name, version),
    ttl: time.Year,
  });
}

export async function getLatestVersion(name) {
  const pkg = await getPackage(name);
  if (pkg['dist-tags'].latest) {
    return pkg['dist-tags'].latest;
  }
  return null;
}

export const BundleSizeJob = Job.create({
  file: import.meta.url,
  name: 'BundleSizeJob',
  async run(name, version) {
    console.log('Get bundle size for: %s@%s', name, version);

    const packageVersion = await getPackageVersion(name, version);
    const hash = createHash('sha256')
      .update(name)
      .update('\n')
      .update(version)
      .update('\n')
      .update('contents')
      .digest('base64url');

    const directory = path.join(CACHE_DIR, hash);
    if (!existsSync(directory)) {
      await fs.mkdir(directory, { recursive: true });

      // @ts-expect-error - this works so I'm not sure what's wrong
      await pipeline(
        got.stream(packageVersion.dist.tarball),
        extract({
          cwd: directory,
        }),
      );
    }

    const packageDirectory = path.join(directory, 'package');
    const sizes = await cache({
      namespace: 'npm-package-size',
      key: `${name}@${version}`,
      get: () => bundleSize(packageDirectory),
      ttl: time.Year,
    });

    return sizes;
  },
});
