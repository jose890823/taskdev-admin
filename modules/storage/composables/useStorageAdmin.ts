import { ref } from 'vue'
import type {
  StorageConfig,
  StorageStats,
  StorageTestResult,
  StorageProviderType,
  UpdateStorageConfigDto,
  StorageProvidersListResponse,
  StorageConfigResponse,
  StorageTestResponse,
  StorageStatsResponse,
} from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

export const useStorageAdmin = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  const providers = ref<StorageConfig[]>([])
  const activeProvider = ref<StorageProviderType | null>(null)
  const stats = ref<StorageStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  const fetchWithAuth = async <T>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {},
    retryOnUnauthorized = true
  ): Promise<T> => {
    try {
      const response = await $fetch<T>(url, {
        ...options,
        headers: { ...options.headers, ...getAuthHeaders() },
      })
      return response as T
    } catch (e: any) {
      if (e.statusCode === 401 && retryOnUnauthorized) {
        const refreshed = await refreshAccessToken()
        if (refreshed) return await fetchWithAuth<T>(url, options, false)
        await logout()
      }
      throw e
    }
  }

  const fetchProviders = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<StorageProvidersListResponse>(`${getApiUrl()}/v1/admin/storage/providers`, { method: 'GET' })
      if (response.success && response.data) {
        providers.value = response.data.providers || []
        activeProvider.value = response.data.activeProvider || null
      }
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener proveedores'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateProviderConfig = async (provider: StorageProviderType, data: UpdateStorageConfigDto): Promise<StorageConfig | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<StorageConfigResponse>(`${getApiUrl()}/v1/admin/storage/providers/${provider}/config`, {
        method: 'PATCH',
        body: data,
      })
      if (response.success && response.data) {
        const index = providers.value.findIndex((p) => p.provider === provider)
        if (index !== -1) providers.value[index] = response.data
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al actualizar configuración'
      throw e
    } finally {
      loading.value = false
    }
  }

  const testProvider = async (provider: StorageProviderType): Promise<StorageTestResult | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<StorageTestResponse>(`${getApiUrl()}/v1/admin/storage/providers/${provider}/test`, { method: 'POST' })
      if (response.success && response.data) return response.data
      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al probar proveedor'
      throw e
    } finally {
      loading.value = false
    }
  }

  const activateProvider = async (provider: StorageProviderType): Promise<StorageConfig | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<StorageConfigResponse>(`${getApiUrl()}/v1/admin/storage/providers/${provider}/activate`, { method: 'POST' })
      if (response.success && response.data) {
        activeProvider.value = provider
        await fetchProviders()
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al activar proveedor'
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async (): Promise<StorageStats | null> => {
    try {
      const response = await fetchWithAuth<StorageStatsResponse>(`${getApiUrl()}/v1/admin/storage/stats`, { method: 'GET' })
      if (response.success && response.data) {
        stats.value = response.data
        return response.data
      }
      return null
    } catch (e: any) {
      console.error('Error al obtener estadísticas:', e)
      return null
    }
  }

  const clearError = () => { error.value = null }

  return {
    providers,
    activeProvider,
    stats,
    loading,
    error,
    fetchProviders,
    updateProviderConfig,
    testProvider,
    activateProvider,
    fetchStats,
    clearError,
  }
}
