/**
 * Cache Service for efficient data management with lottery data
 * 
 * This service provides:
 * - Local storage-based caching for persistent data
 * - Memory-based caching for faster access during the session
 * - Automatic cache invalidation based on TTL
 * - Selective cache invalidation for stale data
 */

// Type definitions for cached items
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Configure default cache settings
const DEFAULT_CACHE_TTL = 1000 * 60 * 5; // 5 minutes
const EXTENDED_CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day

// In-memory cache for faster access
const memoryCache = new Map<string, CacheItem<any>>();

/**
 * Get data from cache - tries memory first, then localStorage
 */
export function getFromCache<T>(key: string): T | null {
  try {
    // Try memory cache first (faster)
    const memItem = memoryCache.get(key);
    if (memItem && memItem.expiresAt > Date.now()) {
      return memItem.data;
    }
    
    // Try local storage if memory cache missed
    const item = localStorage.getItem(`lottery_cache_${key}`);
    if (!item) return null;
    
    const cacheItem: CacheItem<T> = JSON.parse(item);
    
    // Check if the cache is still valid
    if (cacheItem.expiresAt > Date.now()) {
      // Update memory cache for faster access next time
      memoryCache.set(key, cacheItem);
      return cacheItem.data;
    }
    
    // Cache is expired, clean it up
    localStorage.removeItem(`lottery_cache_${key}`);
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Save data to cache in both memory and localStorage
 */
export function saveToCache<T>(
  key: string, 
  data: T, 
  ttl = DEFAULT_CACHE_TTL, 
  persistToStorage = true
): void {
  try {
    const now = Date.now();
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };
    
    // Always save to memory cache
    memoryCache.set(key, cacheItem);
    
    // Optionally save to localStorage for persistence
    if (persistToStorage) {
      localStorage.setItem(
        `lottery_cache_${key}`, 
        JSON.stringify(cacheItem)
      );
    }
  } catch (error) {
    console.warn('Cache save error:', error);
  }
}

/**
 * Remove specific item from cache
 */
export function removeFromCache(key: string): void {
  try {
    memoryCache.delete(key);
    localStorage.removeItem(`lottery_cache_${key}`);
  } catch (error) {
    console.warn('Cache removal error:', error);
  }
}

/**
 * Clear all cached lottery data
 */
export function clearAllCache(): void {
  try {
    // Clear memory cache
    memoryCache.clear();
    
    // Clear localStorage cache (only lottery items)
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('lottery_cache_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}

/**
 * Invalidate cache for a specific series or draw
 */
export function invalidateSeriesCache(seriesIndex?: number, drawId?: number): void {
  try {
    // Clear specific draw cache
    if (seriesIndex !== undefined && drawId !== undefined) {
      removeFromCache(`draw_${seriesIndex}_${drawId}`);
      removeFromCache(`participants_${seriesIndex}_${drawId}`);
    }
    // Clear entire series cache
    else if (seriesIndex !== undefined) {
      // Clear memory cache for series
      Array.from(memoryCache.entries()).forEach(([key]) => {
        if (key.startsWith(`draw_${seriesIndex}_`) || 
            key.startsWith(`participants_${seriesIndex}_`)) {
          memoryCache.delete(key);
        }
      });
      
      // Clear localStorage cache for series
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith(`lottery_cache_draw_${seriesIndex}_`) || 
          key.startsWith(`lottery_cache_participants_${seriesIndex}_`)
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    // Clear all draw data
    else {
      clearAllCache();
    }
  } catch (error) {
    console.warn('Cache invalidation error:', error);
  }
}

/**
 * Get cache keys matching a pattern
 */
export function getCacheKeys(pattern: string): string[] {
  const keys: string[] = [];
  
  // Check memory cache
  Array.from(memoryCache.entries()).forEach(([key]) => {
    if (key.includes(pattern)) {
      keys.push(key);
    }
  });
  
  // Check localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(pattern) && key.startsWith('lottery_cache_')) {
      const actualKey = key.replace('lottery_cache_', '');
      if (!keys.includes(actualKey)) {
        keys.push(actualKey);
      }
    }
  }
  
  return keys;
}

/**
 * Cache draw data with appropriate TTL based on draw status
 */
export function cacheLotteryDraw(
  seriesIndex: number, 
  drawId: number, 
  data: any, 
  isCompleted = false
): void {
  // Completed draws can be cached longer since they don't change
  const ttl = isCompleted ? EXTENDED_CACHE_TTL : DEFAULT_CACHE_TTL;
  saveToCache(`draw_${seriesIndex}_${drawId}`, data, ttl);
}

/**
 * Cache participants with appropriate TTL
 */
export function cacheLotteryParticipants(
  seriesIndex: number,
  drawId: number,
  participants: any[],
  isCompleted = false
): void {
  // Completed draws' participants don't change
  const ttl = isCompleted ? EXTENDED_CACHE_TTL : DEFAULT_CACHE_TTL;
  saveToCache(`participants_${seriesIndex}_${drawId}`, participants, ttl);
}