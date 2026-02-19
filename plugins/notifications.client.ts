/**
 * Plugin de notificaciones en tiempo real (solo cliente)
 * Conecta/desconecta el socket segun el estado de autenticacion
 */
import { useAuth } from '~/modules/auth/composables/useAuth'
import { useNotificationSocket } from '~/composables/useNotificationSocket'
import { useNotifications } from '~/composables/useNotifications'

export default defineNuxtPlugin(() => {
  const { isAuthenticated, accessToken } = useAuth()
  const { connect, disconnect } = useNotificationSocket()
  const { fetchUnreadCount, startListening, stopListening, reset } = useNotifications()

  // Watch auth state
  watch(isAuthenticated, async (authenticated) => {
    if (authenticated && accessToken.value) {
      connect(accessToken.value)
      startListening()
      await fetchUnreadCount()
    } else {
      stopListening()
      disconnect()
      reset()
    }
  }, { immediate: true })
})
