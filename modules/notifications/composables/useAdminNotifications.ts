import { ref } from 'vue'
import type {
  Notification,
  CreateNotificationDto,
  SendBroadcastDto,
  NotificationQueryDto,
  NotificationListResponse,
  BroadcastResponse,
  CleanExpiredResponse,
} from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

export const useAdminNotifications = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const unreadCount = ref(0)
  const page = ref(1)
  const limit = ref(20)

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

  const createNotification = async (data: CreateNotificationDto): Promise<Notification | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/notifications`, {
        method: 'POST',
        body: data,
      })
      if (response.success) return response.data
      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al crear notificación'
      throw e
    } finally {
      loading.value = false
    }
  }

  const sendBroadcast = async (data: SendBroadcastDto): Promise<BroadcastResponse | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/notifications/broadcast`, {
        method: 'POST',
        body: data,
      })
      if (response.success) return response.data
      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al enviar broadcast'
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchUserNotifications = async (userId: string, query?: NotificationQueryDto) => {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, any> = {
        page: query?.page || page.value,
        limit: query?.limit || limit.value,
        ...(query?.type && { type: query.type }),
        ...(query?.status && { status: query.status }),
        ...(query?.isRead !== undefined && { isRead: query.isRead }),
      }
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/notifications/user/${userId}`, {
        method: 'GET',
        params,
      })
      if (response.success && response.data) {
        notifications.value = Array.isArray(response.data) ? response.data : []
        total.value = response.pagination?.total || response.data?.length || 0
        unreadCount.value = response.data.unreadCount || 0
        page.value = response.pagination?.page || 1
      } else {
        notifications.value = []
        total.value = 0
      }
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener notificaciones'
      notifications.value = []
      throw e
    } finally {
      loading.value = false
    }
  }

  const cleanExpired = async (): Promise<CleanExpiredResponse | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/notifications/clean-expired`, {
        method: 'POST',
      })
      if (response.success) return response.data
      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al limpiar notificaciones expiradas'
      throw e
    } finally {
      loading.value = false
    }
  }

  const clearError = () => { error.value = null }

  return {
    notifications,
    loading,
    error,
    total,
    unreadCount,
    page,
    limit,
    createNotification,
    sendBroadcast,
    fetchUserNotifications,
    cleanExpired,
    clearError,
  }
}
