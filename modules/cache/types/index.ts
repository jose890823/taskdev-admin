/**
 * Tipos para el modulo de cache Redis
 */

export interface CacheStats {
  totalKeys: number
  usedMemory: string
  usedMemoryPeak: string
  hitRate: number
  missRate: number
  connectedClients: number
  uptimeInSeconds: number
  evictedKeys: number
  expiredKeys: number
}

export interface CacheHealth {
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  connected: boolean
  version: string
  mode: string
}

export interface CacheKey {
  key: string
  type: string
  ttl: number
  size?: number
}

export interface InvalidateCacheDto {
  pattern: string
}

export interface CacheStatsResponse {
  success: boolean
  data: CacheStats
  message?: string
}

export interface CacheHealthResponse {
  success: boolean
  data: CacheHealth
  message?: string
}

export interface CacheKeysResponse {
  success: boolean
  data: {
    keys: CacheKey[]
    total: number
    pattern: string
  }
  message?: string
}
