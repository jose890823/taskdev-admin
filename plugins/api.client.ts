/**
 * Plugin para manejar errores 401 globalmente
 * Intercepta respuestas de API y redirige al login cuando el token expira
 */
import { useAuth } from '~/modules/auth/composables/useAuth'

export default defineNuxtPlugin((nuxtApp) => {
  // Escuchar errores de fetch globalmente
  nuxtApp.hook('app:error', async (error: any) => {
    // Verificar si es un error 401
    if (error?.statusCode === 401 || error?.response?.status === 401) {
      const { logout, refreshAccessToken, refreshToken } = useAuth()

      // Intentar refrescar el token
      if (refreshToken.value) {
        const refreshed = await refreshAccessToken()
        if (!refreshed) {
          console.log('Token expirado, redirigiendo al login...')
          await logout()
        }
      } else {
        console.log('Sin refresh token, redirigiendo al login...')
        await logout()
      }
    }
  })

  // También interceptar errores de Vue
  nuxtApp.vueApp.config.errorHandler = async (error: any, instance, info) => {
    console.error('Vue error:', error)

    // Verificar si es un error 401
    if (error?.statusCode === 401 || error?.response?.status === 401 || error?.data?.statusCode === 401) {
      const { logout } = useAuth()
      await logout()
    }
  }
})
