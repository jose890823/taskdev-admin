import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCrud } from '~/composables/crud/useCrud'

// Mock de $fetch
vi.mock('#app', () => ({
  $fetch: vi.fn(),
}))

describe('useCrud', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty items', () => {
    const { items, loading, error } = useCrud({
      endpoint: '/api/users',
    })

    expect(items.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('should initialize with initial data', () => {
    const initialData = [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ]

    const { items } = useCrud({
      endpoint: '/api/users',
      initialData,
    })

    expect(items.value).toEqual(initialData)
  })

  it('should set selectedItem', () => {
    const { selectedItem, setSelectedItem } = useCrud({
      endpoint: '/api/users',
    })

    const item = { id: 1, name: 'Test User' }
    setSelectedItem(item)

    expect(selectedItem.value).toEqual(item)
  })
})
