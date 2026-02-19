import { useAuth } from '~/modules/auth/composables/useAuth'
import { canAccessModule } from '~/app/module-config'

/**
 * Middleware de acceso a modulos
 * Verifica que el usuario tenga el rol necesario para acceder al modulo
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) {
    return
  }

  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    return
  }

  const path = to.path
  const moduleName = getModuleNameFromPath(path)

  if (!moduleName) {
    return
  }

  const userRoles = user.value?.roles
  if (!canAccessModule(moduleName, userRoles)) {
    console.warn(`Acceso denegado al modulo '${moduleName}' para roles [${userRoles?.join(', ')}]`)
    return navigateTo('/')
  }
})

function getModuleNameFromPath(path: string): string | null {
  const routeToModule: Record<string, string> = {
    '/users': 'users',
    '/notifications': 'notifications',
    '/security': 'security',
    '/storage': 'storage',
    '/i18n': 'i18n',
    '/cache': 'cache',
    '/jobs': 'jobs',
    '/webhooks': 'webhooks',
    '/feature-flags': 'feature-flags',
    // TaskHub
    '/organizations': 'organizations',
    '/projects/personal': 'personal-projects',
    '/projects': 'projects',
    '/tasks/daily': 'daily',
    '/tasks': 'tasks',
  }

  for (const [route, moduleName] of Object.entries(routeToModule)) {
    if (path === route || path.startsWith(`${route}/`)) {
      return moduleName
    }
  }

  return null
}
