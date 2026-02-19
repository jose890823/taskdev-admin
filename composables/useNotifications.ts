import { ref, computed } from 'vue'
import type { Notification } from '~/modules/notifications/types'
import { useNotificationSocket } from './useNotificationSocket'
import { useAuth } from '~/modules/auth/composables/useAuth'

const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const loading = ref(false)

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

/**
 * Composable para notificaciones del usuario actual
 */
export const useNotifications = () => {
  const { accessToken } = useAuth()

  const hasUnread = computed(() => unreadCount.value > 0)

  /**
   * Fetch notificaciones del usuario
   */
  const fetchNotifications = async (page = 1, limit = 20) => {
    if (!accessToken.value) return

    loading.value = true
    try {
      const response = await $fetch<{
        success: boolean
        data: Notification[]
        pagination: { total: number; page: number; limit: number; totalPages: number }
      }>(`${getApiUrl()}/v1/notifications`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })

      if (response.success) {
        notifications.value = response.data
      }
    } catch (e: any) {
      console.error('Error fetching notifications:', e)
    } finally {
      loading.value = false
    }

    // Fetch unread count separately
    await fetchUnreadCount()
  }

  /**
   * Fetch solo el conteo de no leidas
   */
  const fetchUnreadCount = async () => {
    if (!accessToken.value) return

    try {
      const response = await $fetch<{
        success: boolean
        data: { count: number }
      }>(`${getApiUrl()}/v1/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })

      if (response.success) {
        unreadCount.value = response.data.count
      }
    } catch (e: any) {
      console.error('Error fetching unread count:', e)
    }
  }

  /**
   * Marcar una notificacion como leida
   */
  const markAsRead = async (id: string) => {
    if (!accessToken.value) return

    try {
      await $fetch(`${getApiUrl()}/v1/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })

      // Actualizar localmente
      const notif = notifications.value.find(n => n.id === id)
      if (notif) {
        notif.isRead = true
        notif.readAt = new Date().toISOString()
      }
      if (unreadCount.value > 0) unreadCount.value--
    } catch (e: any) {
      console.error('Error marking notification as read:', e)
    }
  }

  /**
   * Marcar todas como leidas
   */
  const markAllAsRead = async () => {
    if (!accessToken.value) return

    try {
      await $fetch(`${getApiUrl()}/v1/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })

      notifications.value.forEach(n => {
        n.isRead = true
        n.readAt = new Date().toISOString()
      })
      unreadCount.value = 0
    } catch (e: any) {
      console.error('Error marking all as read:', e)
    }
  }

  /**
   * Iniciar listeners de socket para real-time
   */
  const startListening = () => {
    const { onNewNotification, onUnreadCount } = useNotificationSocket()

    onNewNotification((notification: Notification) => {
      // Agregar al inicio de la lista
      notifications.value.unshift(notification)

      // Mostrar toast
      const { info } = useToast()
      info(notification.title, notification.message)
    })

    onUnreadCount((data: { count: number }) => {
      unreadCount.value = data.count
    })
  }

  /**
   * Detener listeners
   */
  const stopListening = () => {
    const { offNewNotification, offUnreadCount } = useNotificationSocket()
    offNewNotification(() => {})
    offUnreadCount(() => {})
  }

  /**
   * Reset state (logout)
   */
  const reset = () => {
    notifications.value = []
    unreadCount.value = 0
  }

  return {
    notifications,
    unreadCount,
    hasUnread,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    startListening,
    stopListening,
    reset,
  }
}
