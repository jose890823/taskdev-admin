import { ref } from 'vue'
import type {
  FeatureFlag,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagFilters,
  FeatureFlagListResponse,
  FeatureFlagResponse,
} from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

/**
 * Composable para gestionar Feature Flags
 */
export const useFeatureFlags = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  // Estado
  const flags = ref<FeatureFlag[]>([])
  const currentFlag = ref<FeatureFlag | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)

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

  /**
   * Listar feature flags con filtros
   */
  const fetchFlags = async (filters?: FeatureFlagFilters) => {
    loading.value = true
    error.value = null

    try {
      const params: Record<string, any> = {
        ...(filters?.page && { page: filters.page }),
        ...(filters?.limit && { limit: filters.limit }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.isEnabled !== undefined && { isEnabled: filters.isEnabled }),
      }

      const response = await fetchWithAuth<FeatureFlagListResponse>(
        '/api/admin/feature-flags',
        {
          method: 'GET',
          params,
        }
      )

      if (response.success && response.data) {
        flags.value = Array.isArray(response.data) ? response.data : []
        total.value = response.pagination?.total || flags.value.length
        page.value = response.pagination?.page || 1
      } else {
        flags.value = []
        total.value = 0
      }

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener feature flags'
      console.error('Error fetching feature flags:', e)
      flags.value = []
      total.value = 0
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener un feature flag por key
   */
  const fetchFlag = async (key: string): Promise<FeatureFlag | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<FeatureFlagResponse>(
        `/api/admin/feature-flags/${key}`,
        {
          method: 'GET',
        }
      )

      if (response.success && response.data) {
        currentFlag.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener feature flag'
      console.error('Error fetching feature flag:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear un nuevo feature flag
   */
  const createFlag = async (data: CreateFeatureFlagDto): Promise<FeatureFlag | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<FeatureFlagResponse>(
        '/api/admin/feature-flags',
        {
          method: 'POST',
          body: data,
        }
      )

      if (response.success && response.data) {
        flags.value.unshift(response.data)
        total.value += 1
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al crear feature flag'
      console.error('Error creating feature flag:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar un feature flag
   */
  const updateFlag = async (id: string, data: UpdateFeatureFlagDto): Promise<FeatureFlag | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<FeatureFlagResponse>(
        `/api/admin/feature-flags/${id}`,
        {
          method: 'PATCH',
          body: data,
        }
      )

      if (response.success && response.data) {
        const index = flags.value.findIndex((f) => f.id === id)
        if (index !== -1) {
          flags.value[index] = response.data
        }
        currentFlag.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al actualizar feature flag'
      console.error('Error updating feature flag:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar un feature flag
   */
  const deleteFlag = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; message?: string }>(
        `/api/admin/feature-flags/${id}`,
        {
          method: 'DELETE',
        }
      )

      if (response.success) {
        flags.value = flags.value.filter((f) => f.id !== id)
        total.value -= 1
        return true
      }

      return false
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al eliminar feature flag'
      console.error('Error deleting feature flag:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle rapido de enable/disable para un feature flag
   */
  const toggleFlag = async (id: string, isEnabled: boolean): Promise<FeatureFlag | null> => {
    error.value = null

    try {
      const response = await fetchWithAuth<FeatureFlagResponse>(
        `/api/admin/feature-flags/${id}`,
        {
          method: 'PATCH',
          body: { isEnabled },
        }
      )

      if (response.success && response.data) {
        const index = flags.value.findIndex((f) => f.id === id)
        if (index !== -1) {
          flags.value[index] = response.data
        }
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || `Error al ${isEnabled ? 'activar' : 'desactivar'} feature flag`
      console.error('Error toggling feature flag:', e)
      throw e
    }
  }

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
    flags.value = []
    currentFlag.value = null
    error.value = null
    total.value = 0
    page.value = 1
  }

  return {
    // Estado
    flags,
    currentFlag,
    loading,
    error,
    total,
    page,
    limit,
    // Metodos
    fetchFlags,
    fetchFlag,
    createFlag,
    updateFlag,
    deleteFlag,
    toggleFlag,
    clearError,
    resetState,
  }
}
