interface CacheItem {
  data: any
  timestamp: number
  expiry: number
}

class GitHubCache {
  private cache: Map<string, CacheItem> = new Map()
  private readonly DEFAULT_EXPIRY = 10 * 60 * 1000 // 10 minutes

  set(key: string, data: any, customExpiry?: number): void {
    const expiry = customExpiry || this.DEFAULT_EXPIRY
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry,
    })

    // Also store in localStorage for persistence
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry,
      }
      localStorage.setItem(`github_cache_${key}`, JSON.stringify(cacheData))
    } catch (error) {
      console.warn("Failed to store in localStorage:", error)
    }
  }

  get(key: string): any | null {
    // First check memory cache
    const memoryItem = this.cache.get(key)
    if (memoryItem && Date.now() - memoryItem.timestamp < memoryItem.expiry) {
      return memoryItem.data
    }

    // Then check localStorage
    try {
      const stored = localStorage.getItem(`github_cache_${key}`)
      if (stored) {
        const item: CacheItem = JSON.parse(stored)
        if (Date.now() - item.timestamp < item.expiry) {
          // Restore to memory cache
          this.cache.set(key, item)
          return item.data
        } else {
          // Remove expired item
          localStorage.removeItem(`github_cache_${key}`)
        }
      }
    } catch (error) {
      console.warn("Failed to read from localStorage:", error)
    }

    return null
  }

  clear(): void {
    this.cache.clear()
    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("github_cache_")) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn("Failed to clear localStorage cache:", error)
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }
}

export const githubCache = new GitHubCache()
