import path from 'node:path';
import { FileCache } from '@nbds/cache';

const CACHE_DIR = path.resolve(import.meta.dirname, '..', '.cache');

let fsCache;

export async function cache({ namespace, key, get, ttl }) {
  if (!fsCache) {
    fsCache = await FileCache.create(CACHE_DIR);
  }
  return fsCache.cache({
    namespace,
    key,
    get,
    ttl,
  });
}
