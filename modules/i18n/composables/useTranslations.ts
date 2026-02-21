import { ref } from 'vue'
import type {
  Translation,
  TranslationLocale,
  CreateTranslationDto,
  UpdateTranslationDto,
  ImportTranslationsDto,
  TranslationFilters,
  TranslationStats,
  TranslationListResponse,
  TranslationResponse,
} from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

/**
 * Composable para gestionar traducciones i18n
 */
export const useTranslations = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  // Estado
  const translations = ref<Translation[]>([])
  const currentTranslation = ref<Translation | null>(null)
  const translationStats = ref<TranslationStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)

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
  // Metodos CRUD
  // ========================

  /**
   * Listar traducciones con filtros y paginacion
   */
  const fetchTranslations = async (filters?: TranslationFilters) => {
    loading.value = true
    error.value = null

    try {
      const params: Record<string, any> = {
        page: filters?.page || page.value,
        limit: filters?.limit || limit.value,
        ...(filters?.search && { search: filters.search }),
        ...(filters?.locale && { locale: filters.locale }),
        ...(filters?.module && { module: filters.module }),
      }

      const response = await fetchWithAuth<TranslationListResponse>(
        `${getApiUrl()}/admin/i18n/translations`,
        {
          method: 'GET',
          params,
        }
      )

      if (response.success && response.data) {
        translations.value = Array.isArray(response.data)
          ? response.data
          : []
        total.value = response.pagination?.total || translations.value.length
        page.value = response.pagination?.page || 1
        limit.value = response.pagination?.limit || 10
      } else {
        translations.value = []
        total.value = 0
      }

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener traducciones'
      console.error('Error fetching translations:', e)
      translations.value = []
      total.value = 0
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener una traduccion por ID
   */
  const fetchTranslation = async (id: string): Promise<Translation | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<TranslationResponse>(
        `${getApiUrl()}/admin/i18n/translations/${id}`,
        {
          method: 'GET',
        }
      )

      if (response.success && response.data) {
        currentTranslation.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener traduccion'
      console.error('Error fetching translation:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear una nueva traduccion
   */
  const createTranslation = async (data: CreateTranslationDto): Promise<Translation | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<TranslationResponse>(
        `${getApiUrl()}/admin/i18n/translations`,
        {
          method: 'POST',
          body: data,
        }
      )

      if (response.success && response.data) {
        translations.value.unshift(response.data)
        total.value += 1
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al crear traduccion'
      console.error('Error creating translation:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar una traduccion
   */
  const updateTranslation = async (id: string, data: UpdateTranslationDto): Promise<Translation | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<TranslationResponse>(
        `${getApiUrl()}/admin/i18n/translations/${id}`,
        {
          method: 'PUT',
          body: data,
        }
      )

      if (response.success && response.data) {
        const index = translations.value.findIndex((t) => t.id === id)
        if (index !== -1) {
          translations.value[index] = response.data
        }
        currentTranslation.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al actualizar traduccion'
      console.error('Error updating translation:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar una traduccion
   */
  const deleteTranslation = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; message?: string }>(
        `${getApiUrl()}/admin/i18n/translations/${id}`,
        {
          method: 'DELETE',
        }
      )

      if (response.success) {
        translations.value = translations.value.filter((t) => t.id !== id)
        total.value -= 1
        return true
      }

      return false
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al eliminar traduccion'
      console.error('Error deleting translation:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ========================
  // Metodos adicionales
  // ========================

  /**
   * Importar traducciones en lote
   */
  const importTranslations = async (data: ImportTranslationsDto): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; message?: string }>(
        `${getApiUrl()}/admin/i18n/translations/import`,
        {
          method: 'POST',
          body: data,
        }
      )

      return response.success || false
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al importar traducciones'
      console.error('Error importing translations:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Exportar traducciones por locale
   */
  const exportTranslations = async (locale: TranslationLocale): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<any>(
        `${getApiUrl()}/admin/i18n/export/${locale}`,
        {
          method: 'GET',
        }
      )

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al exportar traducciones'
      console.error('Error exporting translations:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Recargar cache de traducciones
   */
  const reloadCache = async (): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; message?: string }>(
        `${getApiUrl()}/admin/i18n/reload-cache`,
        {
          method: 'POST',
        }
      )

      return response.success || false
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al recargar cache'
      console.error('Error reloading cache:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener estadisticas de traducciones
   */
  const fetchStats = async (): Promise<TranslationStats | null> => {
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; data: TranslationStats }>(
        `${getApiUrl()}/admin/i18n/stats`,
        {
          method: 'GET',
        }
      )

      if (response.success && response.data) {
        translationStats.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener estadisticas'
      console.error('Error fetching translation stats:', e)
      throw e
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
    translations.value = []
    currentTranslation.value = null
    translationStats.value = null
    error.value = null
    total.value = 0
    page.value = 1
  }

  return {
    // Estado
    translations,
    currentTranslation,
    translationStats,
    loading,
    error,
    total,
    page,
    limit,
    // Metodos CRUD
    fetchTranslations,
    fetchTranslation,
    createTranslation,
    updateTranslation,
    deleteTranslation,
    // Metodos adicionales
    importTranslations,
    exportTranslations,
    reloadCache,
    fetchStats,
    // Utilidades
    clearError,
    resetState,
  }
}
