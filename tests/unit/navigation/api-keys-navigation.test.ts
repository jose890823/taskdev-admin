import { describe, expect, it } from 'vitest'
import { canAccessModule, modules } from '~/app/module-config'
import { getModuleNameFromPath } from '~/middleware/module-access'

describe('API-key navigation registration', () => {
  it('registers the personal module for supported roles', () => {
    const apiKeysModule = modules.find(module => module.name === 'api-keys')

    expect(apiKeysModule).toEqual(expect.objectContaining({
      enabled: true,
      route: '/api-keys',
      icon: 'key-round',
      label: 'API Keys',
      allowedRoles: ['super_admin', 'user'],
      group: 'personal',
    }))
    expect(canAccessModule('api-keys', 'user')).toBe(true)
    expect(canAccessModule('api-keys', 'super_admin')).toBe(true)
    expect(canAccessModule('api-keys', 'unsupported')).toBe(false)
  })

  it('maps the API-key route and its descendants to the protected module', () => {
    expect(getModuleNameFromPath('/api-keys')).toBe('api-keys')
    expect(getModuleNameFromPath('/api-keys/key-1')).toBe('api-keys')
    expect(getModuleNameFromPath('/api-keys-extra')).toBeNull()
  })
})
