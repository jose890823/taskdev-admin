/**
 * Utilidad para manejar errores de API
 * Detecta errores 401 y redirige al login
 */
import { useAuth } from '~/modules/auth/composables/useAuth'

/**
 * Obtener el token de acceso (del estado o localStorage como fallback)
 */
const getToken = (): string | null => {
  const { accessToken } = useAuth()
  if (accessToken.value) return accessToken.value
  if (process.client) {
    return localStorage.getItem('auth-access-token')
  }
  return null
}

/**
 * Obtener el refresh token (del estado o localStorage como fallback)
 */
const getRefreshToken = (): string | null => {
  const { refreshToken } = useAuth()
  if (refreshToken.value) return refreshToken.value
  if (process.client) {
    return localStorage.getItem('auth-refresh-token')
  }
  return null
}

export const handleApiError = async (error: any): Promise<void> => {
  const statusCode = error?.statusCode || error?.response?.status || error?.data?.statusCode

  if (statusCode === 401) {
    const { logout, refreshAccessToken } = useAuth()
    const hasRefreshToken = getRefreshToken()

    // Intentar refrescar el token primero
    if (hasRefreshToken) {
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
}

/**
 * Wrapper para $fetch que maneja errores 401 automáticamente
 */
export const apiFetch = async <T>(url: string, options?: any): Promise<T> => {
  const token = getToken()

  try {
    const response = await $fetch<T>(url, {
      ...options,
      headers: {
        ...options?.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    return response as T
  } catch (error: any) {
    await handleApiError(error)
    throw error
  }
}
