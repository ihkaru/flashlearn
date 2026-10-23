import { auth } from '../auth.svelte';

export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port !== '5173' ? '' : 'http://localhost:3001');

interface CacheEntry {
  data: any;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 25_000; // 25 seconds snappy cache

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const cacheKey = `${endpoint}_${auth.token || 'anon'}`;

  // Serve from memory cache instantly if fresh
  if (isGet) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (auth.token) {
    headers.set('Authorization', `Bearer ${auth.token}`);
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  const data = await res.json();

  if (isGet) {
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });
  } else {
    // Invalidate memory cache on any mutation
    clearApiCache();
  }

  return data;
}
