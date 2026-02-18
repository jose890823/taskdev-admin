import { useAuth } from '~/modules/auth/composables/useAuth'

/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado antes de acceder a rutas protegidas
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Solo ejecutar en el cliente
  if (import.meta.server) {
    return
  }

  const { isAuthenticated, accessToken } = useAuth()

  // Si el estado dice que no está autenticado, verificar localStorage como fallback
  if (!isAuthenticated.value) {
    const storedToken = localStorage.getItem('auth-access-token')
    const storedUser = localStorage.getItem('auth-user')

    // Si no hay tokens en localStorage, redirigir al login
    if (!storedToken || !storedUser) {
      return navigateTo('/login')
    }

    // Si hay tokens pero el estado no está sincronizado, esperar un momento
    // El plugin auth.client.ts debería sincronizar el estado
    if (!accessToken.value) {
      // Dar tiempo al plugin para inicializar
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verificar de nuevo
      if (!isAuthenticated.value) {
        return navigateTo('/login')
      }
    }
  }
})
