/**
 * Configuracion de modulos - TaskHub Admin
 */

export type UserRole = 'user' | 'super_admin'

export type ModuleGroup = 'personal' | 'equipos' | 'sistema'

export interface ModuleConfig {
  name: string
  enabled: boolean
  route: string
  icon?: string
  iconColor?: string
  label: string
  allowedRoles?: UserRole[]
  group?: ModuleGroup
}

export const modules: ModuleConfig[] = [
  // --- Personal ---
  {
    name: 'tasks',
    enabled: true,
    route: '/tasks',
    icon: 'check-square',
    iconColor: '#22c55e',
    label: 'Mis Tareas',
    allowedRoles: ['super_admin', 'user'],
    group: 'personal',
  },
  {
    name: 'daily',
    enabled: true,
    route: '/tasks/daily',
    icon: 'calendar-check',
    iconColor: '#f59e0b',
    label: 'Tareas Diarias',
    allowedRoles: ['super_admin', 'user'],
    group: 'personal',
  },
  {
    name: 'personal-projects',
    enabled: true,
    route: '/projects/personal',
    icon: 'folder',
    iconColor: '#8b5cf6',
    label: 'Mis Proyectos',
    allowedRoles: ['super_admin', 'user'],
    group: 'personal',
  },
  {
    name: 'notifications',
    enabled: true,
    route: '/notifications',
    icon: 'bell',
    iconColor: '#ec4899',
    label: 'Notificaciones',
    allowedRoles: ['super_admin', 'user'],
    group: 'personal',
  },

  // --- Equipos ---
  {
    name: 'organizations',
    enabled: true,
    route: '/organizations',
    icon: 'building-2',
    iconColor: '#0ea5e9',
    label: 'Organizaciones',
    allowedRoles: ['super_admin', 'user'],
    group: 'equipos',
  },
  {
    name: 'projects',
    enabled: true,
    route: '/projects',
    icon: 'folder-kanban',
    iconColor: '#6366f1',
    label: 'Proyectos de Equipo',
    allowedRoles: ['super_admin', 'user'],
    group: 'equipos',
  },

  // --- Sistema ---
  {
    name: 'users',
    enabled: true,
    route: '/users',
    icon: 'users',
    iconColor: '#f43f5e',
    label: 'Usuarios',
    allowedRoles: ['super_admin'],
    group: 'sistema',
  },
  {
    name: 'security',
    enabled: true,
    route: '/security',
    icon: 'shield',
    iconColor: '#ef4444',
    label: 'Seguridad',
    allowedRoles: ['super_admin'],
    group: 'sistema',
  },
  {
    name: 'storage',
    enabled: true,
    route: '/storage',
    icon: 'hard-drive',
    iconColor: '#64748b',
    label: 'Almacenamiento',
    allowedRoles: ['super_admin'],
    group: 'sistema',
  },
  {
    name: 'cache',
    enabled: true,
    route: '/cache',
    icon: 'database',
    iconColor: '#22c55e',
    label: 'Cache',
    allowedRoles: ['super_admin'],
    group: 'sistema',
  },
  {
    name: 'jobs',
    enabled: true,
    route: '/jobs',
    icon: 'clock',
    iconColor: '#f59e0b',
    label: 'Jobs',
    allowedRoles: ['super_admin'],
    group: 'sistema',
  },
  {
    name: 'webhooks',
    enabled: true,
    route: '/webhooks',
    icon: 'webhook',
    iconColor: '#6366f1',
    label: 'Webhooks',
    allowedRoles: ['super_admin'],
    group: 'sistema',
  },
  {
    name: 'feature-flags',
    enabled: true,
    route: '/feature-flags',
    icon: 'toggle-left',
    iconColor: '#8b5cf6',
    label: 'Feature Flags',
    allowedRoles: ['super_admin'],
    group: 'sistema',
  },
  {
    name: 'i18n',
    enabled: true,
    route: '/i18n',
    icon: 'languages',
    iconColor: '#6366f1',
    label: 'Traducciones',
    allowedRoles: ['super_admin'],
    group: 'sistema',
  },
]

export const moduleGroupConfig: Record<ModuleGroup, { label: string; icon: string }> = {
  personal: { label: 'Personal', icon: 'user' },
  equipos: { label: 'Equipos', icon: 'users' },
  sistema: { label: 'Sistema', icon: 'settings' },
}

export const getActiveModules = () => modules.filter(m => m.enabled)

export const getActiveModulesForRole = (userRoles?: UserRole[] | UserRole | string) => {
  const roles = normalizeRoles(userRoles)

  return modules.filter(m => {
    if (!m.enabled) return false
    if (!m.allowedRoles || m.allowedRoles.length === 0) return true
    if (!roles || roles.length === 0) return false
    return roles.some(role => m.allowedRoles!.includes(role))
  })
}

export const getGroupedModulesForRole = (userRoles?: UserRole[] | UserRole | string) => {
  const activeModules = getActiveModulesForRole(userRoles)
  const groups: Record<string, ModuleConfig[]> = {}

  for (const mod of activeModules) {
    const group = mod.group || 'personal'
    if (!groups[group]) groups[group] = []
    groups[group].push(mod)
  }

  return groups
}

export const isModuleActive = (moduleName: string) => {
  const module = modules.find(m => m.name === moduleName)
  return module?.enabled ?? false
}

export const canAccessModule = (moduleName: string, userRoles?: UserRole[] | UserRole | string) => {
  const module = modules.find(m => m.name === moduleName)
  if (!module || !module.enabled) return false

  if (!module.allowedRoles || module.allowedRoles.length === 0) return true

  const roles = normalizeRoles(userRoles)

  if (!roles || roles.length === 0) return false
  return roles.some(role => module.allowedRoles!.includes(role))
}

function normalizeRoles(userRoles?: UserRole[] | UserRole | string): UserRole[] {
  if (!userRoles) return []
  if (Array.isArray(userRoles)) return userRoles
  return [userRoles as UserRole]
}
