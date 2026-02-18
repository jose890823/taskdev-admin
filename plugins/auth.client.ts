/**
 * Plugin de autenticación (solo cliente)
 * Inicializa el estado de autenticación desde localStorage al cargar la app
 */
import { useAuth } from '~/modules/auth/composables/useAuth'

export default defineNuxtPlugin(async () => {
  const { initAuth } = useAuth()

  // Inicializar autenticación desde localStorage
  await initAuth()
})
