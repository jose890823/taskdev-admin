import { ref, computed } from 'vue'
import type { User, LoginDto, RegisterDto, VerifyEmailDto, AuthResponse, UserRole } from '../types'
import { userHasRole, userHasAnyRole, userIsAdmin, userIsSuperAdmin } from '../types'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

// Configuración de cookies
const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 7, // 7 días
  path: '/',
  sameSite: 'lax' as const,
}

/**
 * Composable para gestionar autenticación
 * Usa cookies para que el token esté disponible tanto en cliente como en servidor (SSR)
 */
export const useAuth = () => {
  // Cookies - funcionan tanto en cliente como servidor
  const accessTokenCookie = useCookie<string | null>('auth-access-token', {
    ...COOKIE_OPTIONS,
    default: () => null,
  })
  const refreshTokenCookie = useCookie<string | null>('auth-refresh-token', {
    ...COOKIE_OPTIONS,
    default: () => null,
  })
  const userCookie = useCookie<User | null>('auth-user', {
    ...COOKIE_OPTIONS,
    default: () => null,
  })

  // Estado reactivo basado en cookies
  const user = computed({
    get: () => userCookie.value,
    set: (val) => { userCookie.value = val }
  })
  const accessToken = computed({
    get: () => accessTokenCookie.value,
    set: (val) => { accessTokenCookie.value = val }
  })
  const refreshToken = computed({
    get: () => refreshTokenCookie.value,
    set: (val) => { refreshTokenCookie.value = val }
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!userCookie.value && !!accessTokenCookie.value)
  const isAdmin = computed(() => userIsAdmin(userCookie.value))
  const isSuperAdmin = computed(() => userIsSuperAdmin(userCookie.value))

  /**
   * Inicializar auth - migrar de localStorage a cookies si es necesario
   */
  const initAuth = async () => {
    // Si ya hay token en cookie, no hacer nada
    if (accessTokenCookie.value) {
      return
    }

    // Migrar de localStorage a cookies (solo en cliente)
    if (import.meta.client) {
      const storedToken = localStorage.getItem('auth-access-token')
      const storedRefreshToken = localStorage.getItem('auth-refresh-token')
      const storedUser = localStorage.getItem('auth-user')

      if (storedToken && storedUser) {
        // Migrar a cookies
        accessTokenCookie.value = storedToken
        refreshTokenCookie.value = storedRefreshToken
        userCookie.value = JSON.parse(storedUser)

        // Limpiar localStorage (ya no se usa)
        localStorage.removeItem('auth-access-token')
        localStorage.removeItem('auth-refresh-token')
        localStorage.removeItem('auth-user')
      }
    }
  }

  /**
   * Login de usuario
   * Verifica que el usuario tenga permisos para acceder al panel de administración
   */
  const login = async (credentials: LoginDto): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<AuthResponse>(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        body: credentials,
      })

      if (response.success && response.data) {
        const loggedUser = response.data.user

        // Verificar que el usuario tenga permisos para el panel admin
        const allowedRoles = ['super_admin', 'user']
        const userRoles = loggedUser.roles || []
        const hasAdminAccess = userRoles.some((role: string) => allowedRoles.includes(role))

        if (!hasAdminAccess) {
          error.value = 'No tienes permisos para acceder al panel de administración'
          return false
        }

        // Guardar en cookies
        accessTokenCookie.value = response.data.accessToken
        refreshTokenCookie.value = response.data.refreshToken
        userCookie.value = loggedUser

        return true
      }

      error.value = 'Error en el login'
      return false
    } catch (e: any) {
      // El backend devuelve: { success: false, error: { message: "..." } }
      const backendMessage = e.data?.error?.message || e.data?.message

      // Si hay mensaje del backend, usarlo; si no, mostrar mensaje genérico según status
      if (backendMessage) {
        error.value = backendMessage
      } else if (e.statusCode === 401) {
        error.value = 'Credenciales inválidas'
      } else {
        error.value = 'Error al iniciar sesión'
      }

      console.error('Login error:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout de usuario
   */
  const logout = async () => {
    loading.value = true

    try {
      // Llamar al endpoint de logout
      await $fetch(`${getApiUrl()}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessTokenCookie.value}`,
        },
      })
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      // Limpiar cookies
      accessTokenCookie.value = null
      refreshTokenCookie.value = null
      userCookie.value = null

      loading.value = false

      // Redirigir a login
      await navigateTo('/login')
    }
  }

  /**
   * Obtener usuario actual desde el backend
   */
  const getMe = async (retryWithRefresh = true): Promise<User | null> => {
    if (!accessTokenCookie.value) return null

    try {
      const response = await $fetch<{ success: boolean; data: User }>(`${getApiUrl()}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessTokenCookie.value}`,
        },
      })

      if (response.success && response.data) {
        userCookie.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      console.error('GetMe error:', e)

      // Si el token expiró (401)
      if (e.statusCode === 401) {
        // Si podemos reintentar con refresh token
        if (retryWithRefresh && refreshTokenCookie.value) {
          console.log('Access token expirado, intentando refrescar...')

          const refreshed = await refreshAccessToken()

          if (refreshed) {
            // Reintentar getMe con el nuevo token (sin retry para evitar loop infinito)
            return await getMe(false)
          }
        }

        // Si no hay refresh token o el refresh falló, hacer logout
        console.log('No se pudo refrescar el token, cerrando sesión...')
        await logout()
        return null
      }

      // Para otros errores (network, 500, etc), NO hacer logout automático
      console.warn('Error obteniendo usuario, usando datos en cache')
      return userCookie.value
    }
  }

  /**
   * Refrescar access token usando refresh token
   */
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshTokenCookie.value) return false

    try {
      const response = await $fetch<{
        success: boolean
        data: { accessToken: string; refreshToken: string }
      }>(`${getApiUrl()}/auth/refresh`, {
        method: 'POST',
        body: {
          refreshToken: refreshTokenCookie.value,
        },
      })

      if (response.success && response.data) {
        accessTokenCookie.value = response.data.accessToken
        refreshTokenCookie.value = response.data.refreshToken
        return true
      }

      return false
    } catch (e: any) {
      console.error('Refresh token error:', e)

      // Solo hacer logout si el refresh token es inválido (401/403)
      if (e.statusCode === 401 || e.statusCode === 403) {
        return false
      }

      // Error de red u otro - mantener sesión
      console.warn('Error de red al refrescar token, manteniendo sesión')
      return false
    }
  }

  /**
   * Registro de nuevo usuario
   */
  const register = async (dto: RegisterDto): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`${getApiUrl()}/auth/register`, {
        method: 'POST',
        body: dto,
      })
      return true
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error al registrar'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Verificar email con codigo OTP
   */
  const verifyEmail = async (dto: VerifyEmailDto): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`${getApiUrl()}/auth/verify-email`, {
        method: 'POST',
        body: dto,
      })
      return true
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Codigo invalido'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Reenviar codigo OTP
   */
  const resendOtp = async (email: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`${getApiUrl()}/auth/resend-otp`, {
        method: 'POST',
        body: { email },
      })
      return true
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error al reenviar codigo'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userCookie.value) return false

    if (Array.isArray(role)) {
      return userHasAnyRole(userCookie.value, role)
    }

    return userHasRole(userCookie.value, role)
  }

  return {
    // Estado
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    // Computed
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    // Métodos
    login,
    logout,
    register,
    verifyEmail,
    resendOtp,
    getMe,
    refreshAccessToken,
    initAuth,
    hasRole,
  }
}
