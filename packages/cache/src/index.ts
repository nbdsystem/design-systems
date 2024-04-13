import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as time from './time';

class FileCache {
  static async create(directory: string) {
    if (!existsSync(directory)) {
      await fs.mkdir(directory, { recursive: true });
    }
    return new FileCache(directory);
  }

  directory: string;

  constructor(directory: string) {
    this.directory = directory;
  }

  async cache<T>({
    namespace,
    key,
    get,
    ttl = time.Day,
  }: {
    namespace?: string;
    key: string;
    get: () => Promise<T>;
    ttl?: number;
  }): Promise<T> {
    const hash = createHash('sha256').update(key).digest('base64url');
    const cacheFilepath = namespace
      ? path.join(this.directory, namespace, hash)
      : path.join(this.directory, hash);

    if (existsSync(cacheFilepath)) {
      const contents = await fs.readFile(cacheFilepath, 'utf8');
      try {
        const json = JSON.parse(contents);
        if (json.expires > Date.now()) {
          return json.value as T;
        }
      } catch {}
    }

    const result = await get();
    const cacheItem = {
      expires: Date.now() + ttl,
      value: result,
    };

    if (namespace) {
      const namespaceDirectory = path.join(this.directory, namespace);
      if (!existsSync(namespaceDirectory)) {
        await fs.mkdir(namespaceDirectory, { recursive: true });
      }
    }

    await fs.writeFile(cacheFilepath, JSON.stringify(cacheItem), 'utf8');

    return result;
  }
}

export { FileCache };
