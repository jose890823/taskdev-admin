import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ApiKeysPage from '~/pages/api-keys/index.vue'
import { API_KEY_SCOPES } from '~/modules/api-keys/types'

const mocks = {
  user: ref<any>(null),
  isSuperAdmin: ref(false),
  apiKeys: ref<any[]>([]),
  pagination: ref({ page: 1, limit: 20, total: 40, totalPages: 2 }),
  projects: ref<any[]>([]),
  users: ref<any[]>([]),
  loading: ref(false),
  error: ref<string | null>(null),
  fetchApiKeys: vi.fn().mockResolvedValue(undefined),
  fetchApiKey: vi.fn(),
  createApiKey: vi.fn(),
  replaceApiKey: vi.fn(),
  revokeApiKey: vi.fn(),
  fetchAll: vi.fn().mockResolvedValue(undefined),
  fetchUsers: vi.fn().mockResolvedValue(undefined),
}

vi.mock('~/modules/auth/composables/useAuth', () => ({ useAuth: () => mocks }))
vi.mock('~/modules/api-keys/composables/useApiKeys', () => ({ useApiKeys: () => mocks }))
vi.mock('~/modules/projects/composables/useProjects', () => ({ useProjects: () => mocks }))
vi.mock('~/modules/users/composables/useUsers', () => ({ useUsers: () => mocks }))

const components = {
  Button: { inheritAttrs: false, template: '<button v-bind="$attrs"><slot /></button>' },
  Input: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
  Label: { template: '<label><slot /></label>' },
  Badge: { template: '<span><slot /></span>' },
  Card: { template: '<section><slot /></section>' },
  CardHeader: { template: '<div><slot /></div>' },
  CardContent: { template: '<div><slot /></div>' },
  CardTitle: { template: '<h2><slot /></h2>' },
  CardDescription: { template: '<p><slot /></p>' },
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<h2><slot /></h2>' },
  DialogDescription: { template: '<p><slot /></p>' },
  DialogFooter: { template: '<div><slot /></div>' },
  AlertDialog: { template: '<div><slot /></div>' },
  AlertDialogContent: { template: '<div><slot /></div>' },
  AlertDialogHeader: { template: '<div><slot /></div>' },
  AlertDialogTitle: { template: '<h2><slot /></h2>' },
  AlertDialogDescription: { template: '<p><slot /></p>' },
  AlertDialogFooter: { template: '<div><slot /></div>' },
  AlertDialogAction: { inheritAttrs: false, template: '<button v-bind="$attrs"><slot /></button>' },
  AlertDialogCancel: { inheritAttrs: false, template: '<button v-bind="$attrs"><slot /></button>' },
  PaginationControls: { template: '<div><slot /></div>' },
  Select: { props: ['modelValue'], emits: ['update:modelValue'], template: '<select v-bind="$attrs" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>' },
  SelectContent: { template: '<slot />' },
  SelectItem: { props: ['value'], template: '<option :value="value"><slot /></option>' },
  SelectTrigger: { template: '<span><slot /></span>' },
  SelectValue: { props: ['placeholder'], template: '<span>{{ placeholder }}</span>' },
  Checkbox: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />' },
}

const metadata = {
  id: 'key-1',
  name: 'Task reader',
  ownerId: 'owner-1',
  projectId: 'project-1',
  owner: { id: 'owner-1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test' },
  project: { id: 'project-1', name: 'TaskHub', slug: 'taskhub' },
  scopes: ['tasks:read'],
  createdAt: '2026-09-16T10:00:00.000Z',
  lastUsedAt: null,
  expiresAt: '2026-12-15T10:00:00.000Z',
  status: 'expired',
  revokedAt: null,
}

beforeEach(() => {
  mocks.user.value = { id: 'user-1', roles: ['user'], firstName: 'User', lastName: 'One' }
  mocks.isSuperAdmin.value = false
  mocks.apiKeys.value = [metadata]
  mocks.pagination.value = { page: 1, limit: 20, total: 40, totalPages: 2 }
  mocks.projects.value = [{ id: 'project-1', name: 'TaskHub', slug: 'taskhub' }]
  mocks.users.value = [{ id: 'owner-1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test' }]
  mocks.error.value = null
  vi.clearAllMocks()
})

const mountPage = async () => {
  const wrapper = mount(ApiKeysPage, { global: { stubs: components } })
  await flushPromises()
  return wrapper
}

describe('API-key management page', () => {
  it('keeps owner selection unavailable to users and available only to superadmins', async () => {
    const userPage = await mountPage()
    expect(userPage.find('#owner-id').exists()).toBe(false)

    mocks.isSuperAdmin.value = true
    mocks.user.value.roles = ['super_admin']
    const superadminPage = await mountPage()
    expect(superadminPage.find('#owner-id').exists()).toBe(true)
    expect(mocks.fetchUsers).toHaveBeenCalled()
  })

  it('requires a project and at least one approved scope, and exposes only supported expiry values', async () => {
    const wrapper = await mountPage()
    await wrapper.get('button:not([type="submit"])').trigger('click')
    const submit = wrapper.get('button[type="submit"]')
    expect((submit.element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.findAll('#expiry-days option').map(option => (option.element as HTMLOptionElement).value)).toEqual(['30', '90', '180', '365'])

    await wrapper.get('#api-key-name').setValue('Build key')
    expect((submit.element as HTMLButtonElement).disabled).toBe(true)
    await wrapper.get('#project-id').setValue('project-1')
    expect((submit.element as HTMLButtonElement).disabled).toBe(false)
    await wrapper.get('input[type="checkbox"]').setValue(false)
    expect((submit.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('rejects unsupported scopes and expiry values before mutation', async () => {
    const wrapper = await mountPage()
    await wrapper.findAll('button').find(button => button.text() === 'Crear clave API')!.trigger('click')
    await wrapper.get('#api-key-name').setValue('Bounded key')
    await wrapper.get('#project-id').setValue('project-1')

    const form = (wrapper.vm as any).$?.setupState.form
    form.scopes = ['unsupported']
    await flushPromises()
    expect((wrapper.get('button[type="submit"]').element as HTMLButtonElement).disabled).toBe(true)
    await wrapper.get('form').trigger('submit')

    form.scopes = ['tasks:read']
    form.expirationDays = 45
    await flushPromises()
    expect((wrapper.get('button[type="submit"]').element as HTMLButtonElement).disabled).toBe(true)
    await wrapper.get('form').trigger('submit')

    expect(mocks.createApiKey).not.toHaveBeenCalled()
  })

  it('renders server status and expiry metadata with the date utility output', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Expirada')
    expect(wrapper.text()).toContain('15 dic 2026')
    expect(wrapper.text()).toContain('Ada Lovelace')
  })

  it('selects all available scopes and can clear them', async () => {
    const wrapper = await mountPage()
    await wrapper.findAll('button').find(button => button.text() === 'Crear clave API')!.trigger('click')

    const form = (wrapper.vm as any).$?.setupState.form
    await wrapper.findAll('button').find(button => button.text() === 'Seleccionar todos')!.trigger('click')
    expect(form.scopes).toEqual([...API_KEY_SCOPES])
    expect(wrapper.text()).toContain('Todos seleccionados')

    await wrapper.findAll('button').find(button => button.text() === 'Limpiar')!.trigger('click')
    expect(form.scopes).toEqual([])
  })

  it('renders API-key metadata without nested summaries and uses local names in the list and inspect dialog', async () => {
    const metadataWithoutNestedSummaries = {
      id: 'key-1',
      name: 'Task reader',
      ownerId: 'owner-1',
      projectId: 'project-1',
      scopes: ['tasks:read'],
      createdAt: '2026-09-16T10:00:00.000Z',
      lastUsedAt: null,
      expiresAt: '2026-12-15T10:00:00.000Z',
      status: 'active' as const,
      revokedAt: null,
    }
    mocks.apiKeys.value = [metadataWithoutNestedSummaries]
    mocks.projects.value = [{ id: 'project-1', name: 'Local TaskHub' }]
    mocks.users.value = [{ id: 'owner-1', firstName: 'Local', lastName: 'Owner', email: 'owner@example.test' }]
    mocks.fetchApiKey.mockResolvedValueOnce(metadataWithoutNestedSummaries)

    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Local TaskHub · Local Owner')

    await wrapper.findAll('button').find(button => button.text() === 'Reemplazar')!.trigger('click')
    expect((wrapper.get('#project-id').element as HTMLSelectElement).value).toBe('project-1')

    await wrapper.get('button[aria-label="Inspeccionar key-1"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Propietario: Local Owner')
    expect(wrapper.text()).toContain('Proyecto: Local TaskHub')
  })

  it('falls back to owner and project IDs when API-key summaries and local records are unavailable', async () => {
    const metadataWithoutSummaries = {
      id: 'key-1',
      name: 'Task reader',
      ownerId: 'owner-1',
      projectId: 'project-1',
      scopes: ['tasks:read'],
      createdAt: '2026-09-16T10:00:00.000Z',
      lastUsedAt: null,
      expiresAt: '2026-12-15T10:00:00.000Z',
      status: 'expired' as const,
      revokedAt: null,
    }
    mocks.apiKeys.value = [metadataWithoutSummaries]
    mocks.projects.value = []
    mocks.users.value = []
    mocks.fetchApiKey.mockResolvedValueOnce(metadataWithoutSummaries)

    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('project-1 · owner-1')

    await wrapper.get('button[aria-label="Inspeccionar key-1"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Propietario: owner-1')
    expect(wrapper.text()).toContain('Proyecto: project-1')
  })

  it('renders every lifecycle status from the server without deriving a client status', async () => {
    mocks.apiKeys.value = [
      { ...metadata, id: 'active-key', status: 'active' },
      { ...metadata, id: 'expired-key', status: 'expired' },
      { ...metadata, id: 'revoked-key', status: 'revoked' },
    ]
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Activa')
    expect(wrapper.text()).toContain('Expirada')
    expect(wrapper.text()).toContain('Revocada')
  })

  it('renders server pagination and requests the selected page', async () => {
    const wrapper = await mountPage()
    const pagination = wrapper.findComponent(components.PaginationControls)

    expect(pagination.exists()).toBe(true)
    pagination.vm.$emit('update:page', 2)
    await flushPromises()

    expect(mocks.fetchApiKeys).toHaveBeenCalledWith({ page: 2, limit: 20 })
  })

  it('preserves form state after a rejected create and does not disclose a secret', async () => {
    mocks.createApiKey.mockRejectedValueOnce(new Error('rejected'))
    const wrapper = await mountPage()
    await wrapper.get('button:not([type="submit"])').trigger('click')
    await wrapper.get('#api-key-name').setValue('Keep this name')
    await wrapper.get('#project-id').setValue('project-1')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect((wrapper.get('#api-key-name').element as HTMLInputElement).value).toBe('Keep this name')
    expect(wrapper.text()).not.toContain('one-time-secret')
  })

  it('submits the backend expirationDays contract for API-key creation', async () => {
    mocks.createApiKey.mockResolvedValueOnce({ key: metadata, secret: 'thk_one_time_secret' })
    const wrapper = await mountPage()
    await wrapper.get('button').trigger('click')
    await wrapper.get('#api-key-name').setValue('Build key')
    await wrapper.get('#project-id').setValue('project-1')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect(mocks.createApiKey).toHaveBeenCalledWith({
      name: 'Build key',
      projectId: 'project-1',
      scopes: ['tasks:read'],
      expirationDays: 30,
    })
  })

  it('inspects metadata without invoking recovery', async () => {
    mocks.fetchApiKey.mockResolvedValueOnce(metadata)
    const wrapper = await mountPage()
    await wrapper.get('button[aria-label="Inspeccionar key-1"]').trigger('click')
    await flushPromises()

    expect(mocks.fetchApiKey).toHaveBeenCalledWith('key-1')
    expect(wrapper.text()).not.toContain('one-time-secret')
    expect(wrapper.findAll('button').filter(button => button.text().match(/recover/i)).length).toBe(0)
  })

  it('discloses a create secret once, copies it without persistence, and clears it on close', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const storage = vi.spyOn(Storage.prototype, 'setItem')
    const pushState = vi.spyOn(window.history, 'pushState')
    mocks.createApiKey.mockResolvedValueOnce({ key: metadata, secret: 'thk_one_time_secret' })
    const wrapper = await mountPage()
    await wrapper.get('button').trigger('click')
    await wrapper.get('#api-key-name').setValue('Build key')
    await wrapper.get('#project-id').setValue('project-1')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[data-testid="one-time-secret"]').text()).toBe('thk_one_time_secret')
    await wrapper.findAll('button').filter(button => button.text() === 'Copiar secreto')[0].trigger('click')
    expect(writeText).toHaveBeenCalledWith('thk_one_time_secret')
    expect(storage).not.toHaveBeenCalled()
    expect(pushState).not.toHaveBeenCalled()
    await wrapper.findAll('button').filter(button => button.text() === 'Cerrar')[0].trigger('click')
    expect(wrapper.find('[data-testid="one-time-secret"]').exists()).toBe(false)
  })

  it('keeps metadata and shows safe errors when create, replace, or revoke is rejected', async () => {
    mocks.apiKeys.value = [{ ...metadata, status: 'active' }]
    mocks.error.value = 'No se pudo completar la solicitud de forma segura.'
    mocks.createApiKey.mockRejectedValueOnce(new Error('secret=thk_hidden'))
    mocks.replaceApiKey.mockRejectedValueOnce(new Error('secret=thk_hidden'))
    mocks.revokeApiKey.mockRejectedValueOnce(new Error('secret=thk_hidden'))
    const wrapper = await mountPage()

    await wrapper.findAll('button').find(button => button.text() === 'Crear clave API')!.trigger('click')
    await wrapper.get('#api-key-name').setValue('Rejected create')
    await wrapper.get('#project-id').setValue('project-1')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('segura')
    expect(wrapper.text()).not.toContain('thk_hidden')

    await wrapper.findAll('button').find(button => button.text() === 'Cancelar')!.trigger('click')
    await wrapper.findAll('button').find(button => button.text() === 'Reemplazar')!.trigger('click')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Task reader')
    expect(wrapper.text()).not.toContain('thk_hidden')

    await wrapper.findAll('button').find(button => button.text() === 'Revocar')!.trigger('click')
    await wrapper.findAll('button').filter(button => button.text() === 'Revocar').at(-1)!.trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('segura')
    expect(wrapper.text()).toContain('Activa')
  })

  it('renders the revoked state returned by a successful revoke', async () => {
    mocks.apiKeys.value = [{ ...metadata, status: 'active' }]
    mocks.revokeApiKey.mockImplementationOnce(async () => {
      mocks.apiKeys.value = [{ ...metadata, status: 'revoked', revokedAt: '2026-09-16T12:00:00.000Z' }]
      return mocks.apiKeys.value[0]
    })
    const wrapper = await mountPage()

    await wrapper.findAll('button').find(button => button.text() === 'Revocar')!.trigger('click')
    await wrapper.findAll('button').filter(button => button.text() === 'Revocar').at(-1)!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Revocada')
    expect(wrapper.get('article').findAll('button').filter(button => button.text() === 'Revocar').length).toBe(0)
  })

  it('discloses a replacement secret and clears it after dismissal', async () => {
    mocks.apiKeys.value = [{ ...metadata, status: 'active' }]
    mocks.replaceApiKey.mockResolvedValueOnce({ key: metadata, secret: 'thk_replacement_secret' })
    const wrapper = await mountPage()
    await wrapper.findAll('button').find(button => button.text() === 'Reemplazar')!.trigger('click')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[data-testid="one-time-secret"]').text()).toBe('thk_replacement_secret')
    await wrapper.findAll('button').filter(button => button.text() === 'Cerrar')[0].trigger('click')
    expect(wrapper.find('[data-testid="one-time-secret"]').exists()).toBe(false)
  })

  it('shows a generic safe error when a lifecycle operation has no public message', async () => {
    mocks.createApiKey.mockRejectedValueOnce(new Error('secret=thk_hidden'))
    const wrapper = await mountPage()
    await wrapper.findAll('button').find(button => button.text() === 'Crear clave API')!.trigger('click')
    await wrapper.get('#api-key-name').setValue('Rejected key')
    await wrapper.get('#project-id').setValue('project-1')
    await wrapper.get('button[type="submit"]').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('solicitud de la clave API fue rechazada')
    expect(wrapper.text()).not.toContain('thk_hidden')
  })
})
