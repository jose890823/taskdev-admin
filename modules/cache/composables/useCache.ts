import { ref } from 'vue'
import type {
  CacheStats,
  CacheHealth,
  CacheKey,
  CacheStatsResponse,
  CacheHealthResponse,
  CacheKeysResponse,
} from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

/**
 * Composable para gestionar cache Redis desde el admin
 */
export const useCache = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  // Estado
  const stats = ref<CacheStats | null>(null)
  const health = ref<CacheHealth | null>(null)
  const keys = ref<CacheKey[]>([])
  const keysTotal = ref(0)
  const keysPattern = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Obtener headers de autenticacion
   */
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  /**
   * Ejecutar peticion con manejo de 401 (intenta refrescar token y reintentar)
   */
  const fetchWithAuth = async <T>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {},
    retryOnUnauthorized = true
  ): Promise<T> => {
    try {
      const response = await $fetch<T>(url, {
        ...options,
        headers: {
          ...options.headers,
          ...getAuthHeaders(),
        },
      })
      return response as T
    } catch (e: any) {
      if (e.statusCode === 401 && retryOnUnauthorized) {
        const refreshed = await refreshAccessToken()

        if (refreshed) {
          return await fetchWithAuth<T>(url, options, false)
        }

        await logout()
      }
      throw e
    }
  }

  // ========================
  // Metodos de Cache
  // ========================

  /**
   * Obtener estadisticas del cache
   */
  const fetchStats = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<CacheStatsResponse>(`${getApiUrl()}/admin/cache/stats`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        stats.value = response.data
      }

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener estadisticas de cache'
      console.error('Error fetching cache stats:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener estado de salud del cache
   */
  const fetchHealth = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<CacheHealthResponse>(`${getApiUrl()}/admin/cache/health`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        health.value = response.data
      }

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener salud del cache'
      console.error('Error fetching cache health:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Buscar keys por patron
   */
  const fetchKeys = async (pattern: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<CacheKeysResponse>(`${getApiUrl()}/admin/cache/keys/${encodeURIComponent(pattern)}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        keys.value = response.data.keys || []
        keysTotal.value = response.data.total || 0
        keysPattern.value = response.data.pattern || pattern
      }

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al buscar keys de cache'
      console.error('Error fetching cache keys:', e)
      keys.value = []
      keysTotal.value = 0
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Invalidar cache por patron
   */
  const invalidateCache = async (pattern: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; message?: string }>(`${getApiUrl()}/admin/cache/invalidate`, {
        method: 'POST',
        body: { pattern },
      })

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al invalidar cache'
      console.error('Error invalidating cache:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Limpiar todo el cache (flush)
   */
  const flushCache = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; message?: string }>(`${getApiUrl()}/admin/cache/flush`, {
        method: 'POST',
      })

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al limpiar cache'
      console.error('Error flushing cache:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ========================
  // Utilidades
  // ========================

  /**
   * Limpiar error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Resetear estado
   */
  const resetState = () => {
    stats.value = null
    health.value = null
    keys.value = []
    keysTotal.value = 0
    keysPattern.value = ''
    error.value = null
  }

  return {
    // Estado
    stats,
    health,
    keys,
    keysTotal,
    keysPattern,
    loading,
    error,
    // Metodos
    fetchStats,
    fetchHealth,
    fetchKeys,
    invalidateCache,
    flushCache,
    // Utilidades
    clearError,
    resetState,
  }
}
