import { io, Socket } from 'socket.io-client'
import type { Notification } from '~/modules/notifications/types'

let socket: Socket | null = null

/**
 * Singleton socket connection for real-time notifications
 */
export const useNotificationSocket = () => {
  const config = useRuntimeConfig()
  // apiUrl es algo como http://localhost:3001/api, pero el WS va a la raiz
  const baseUrl = (config.public.apiUrl as string).replace(/\/api$/, '')

  const connect = (token: string) => {
    if (socket?.connected) return

    socket = io(`${baseUrl}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socket.on('connect', () => {
      console.log('[NotificationSocket] Conectado')
    })

    socket.on('disconnect', (reason) => {
      console.log('[NotificationSocket] Desconectado:', reason)
    })

    socket.on('connect_error', (err) => {
      console.warn('[NotificationSocket] Error de conexion:', err.message)
    })
  }

  const disconnect = () => {
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
      socket = null
    }
  }

  const onNewNotification = (callback: (notification: Notification) => void) => {
    socket?.on('new-notification', callback)
  }

  const onUnreadCount = (callback: (data: { count: number }) => void) => {
    socket?.on('unread-count', callback)
  }

  const offNewNotification = (callback: (notification: Notification) => void) => {
    socket?.off('new-notification', callback)
  }

  const offUnreadCount = (callback: (data: { count: number }) => void) => {
    socket?.off('unread-count', callback)
  }

  const isConnected = () => socket?.connected ?? false

  return {
    connect,
    disconnect,
    onNewNotification,
    onUnreadCount,
    offNewNotification,
    offUnreadCount,
    isConnected,
  }
}
