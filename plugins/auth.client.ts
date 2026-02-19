/**
 * Plugin de autenticación (solo cliente)
 * Inicializa el estado de autenticación y valida el token contra el backend
 */
import { useAuth } from '~/modules/auth/composables/useAuth'

export default defineNuxtPlugin(async () => {
  const { initAuth, isAuthenticated, getMe } = useAuth()

  // Inicializar autenticación desde localStorage/cookies
  await initAuth()

  // Si hay sesion activa, validar que el usuario sigue existiendo en el backend
  if (isAuthenticated.value) {
    await getMe()
  }
})
