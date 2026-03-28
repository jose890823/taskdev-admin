import { ref } from 'vue'
import type {
  WebhookEvent,
  WebhookStats,
  WebhookFilters,
  WebhookEventListResponse,
  WebhookEventResponse,
  WebhookStatsResponse,
} from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

/**
 * Composable para gestionar webhook events
 */
export const useWebhooks = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  // Estado
  const events = ref<WebhookEvent[]>([])
  const currentEvent = ref<WebhookEvent | null>(null)
  const stats = ref<WebhookStats | null>(null)
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
  // Metodos de Webhook Events
  // ========================

  /**
   * Listar webhook events con filtros y paginacion
   */
  const fetchEvents = async (filters?: WebhookFilters) => {
    loading.value = true
    error.value = null

    try {
      const params = {
        page: filters?.page || page.value,
        limit: filters?.limit || limit.value,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.eventType && { eventType: filters.eventType }),
      }

      const response = await fetchWithAuth<WebhookEventListResponse>(`${getApiUrl()}/webhooks/events`, {
        method: 'GET',
        params,
      })

      if (response.success && response.data) {
        events.value = Array.isArray(response.data.events) ? response.data.events : []
        total.value = response.data.total || events.value.length
        page.value = response.data.page || 1
        limit.value = response.data.limit || 10
      } else {
        events.value = []
        total.value = 0
      }

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener webhook events'
      console.error('Error fetching webhook events:', e)
      events.value = []
      total.value = 0
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener un webhook event por ID
   */
  const fetchEvent = async (id: string): Promise<WebhookEvent | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<WebhookEventResponse>(`${getApiUrl()}/webhooks/events/${id}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        currentEvent.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener webhook event'
      console.error('Error fetching webhook event:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Reintentar un webhook event fallido
   */
  const retryEvent = async (id: string): Promise<WebhookEvent | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<WebhookEventResponse>(`${getApiUrl()}/webhooks/events/${id}/retry`, {
        method: 'POST',
      })

      if (response.success && response.data) {
        // Actualizar el evento en la lista local
        const index = events.value.findIndex((e) => e.id === id)
        if (index !== -1) {
          events.value[index] = response.data
        }
        currentEvent.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al reintentar webhook event'
      console.error('Error retrying webhook event:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener estadisticas de webhooks
   */
  const fetchStats = async (): Promise<WebhookStats | null> => {
    try {
      const response = await fetchWithAuth<WebhookStatsResponse>(`${getApiUrl()}/webhooks/stats`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        stats.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      console.error('Error fetching webhook stats:', e)
      return null
    }
  }

  /**
   * Limpiar eventos antiguos
   */
  const cleanupEvents = async (): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      await fetchWithAuth(`${getApiUrl()}/webhooks/cleanup`, {
        method: 'DELETE',
      })

      // Recargar datos despues de limpiar
      await Promise.all([fetchEvents(), fetchStats()])
      return true
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al limpiar eventos antiguos'
      console.error('Error cleaning up webhook events:', e)
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
    events.value = []
    currentEvent.value = null
    stats.value = null
    error.value = null
    total.value = 0
    page.value = 1
  }

  return {
    // Estado
    events,
    currentEvent,
    stats,
    loading,
    error,
    total,
    page,
    limit,
    // Metodos
    fetchEvents,
    fetchEvent,
    retryEvent,
    fetchStats,
    cleanupEvents,
    // Utilidades
    clearError,
    resetState,
  }
}
