import fs from 'node:fs';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), 'content/panels/cache');

const DEFAULT_TTL = 3600;

export interface CacheEntry<T> {
  data: T;
  ts: number;
}

export function getCacheEntry<T>(slug: string, sectionId: string): CacheEntry<T> | null {
  if (!slug || !sectionId) return null;
  
  try {
    const cachePath = path.join(CACHE_DIR, `${slug}-${sectionId}.json`);
    if (!fs.existsSync(cachePath)) return null;
    
    const content = fs.readFileSync(cachePath, 'utf8');
    const entry = JSON.parse(content) as CacheEntry<T>;
    return entry;
  } catch {
    return null;
  }
}

export function isCacheValid<T>(slug: string, sectionId: string, ttl: number = DEFAULT_TTL): boolean {
  const entry = getCacheEntry<T>(slug, sectionId);
  if (!entry) return false;
  
  const age = (Date.now() - entry.ts) / 1000;
  return age < ttl;
}

export function readCacheOrFetch<T>(
  slug: string,
  sectionId: string,
  fetchFn: () => Promise<T | null>,
  ttl: number = DEFAULT_TTL
): Promise<T | null> {
  if (slug && sectionId) {
    const entry = getCacheEntry<T>(slug, sectionId);
    if (entry) {
      const age = (Date.now() - entry.ts) / 1000;
      if (age < ttl) {
        return Promise.resolve(entry.data);
      }
    }
  }
  
  return fetchFn().then(async (data) => {
    if (data && slug && sectionId) {
      await writeCacheEntry(slug, sectionId, data);
    }
    return data;
  });
}

export async function writeCacheEntry<T>(slug: string, sectionId: string, data: T): Promise<void> {
  if (!slug || !sectionId) return;
  
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const cachePath = path.join(CACHE_DIR, `${slug}-${sectionId}.json`);
    fs.writeFileSync(cachePath, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Silent fail on cache write
  }
}