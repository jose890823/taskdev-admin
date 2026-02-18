import { ref, computed, type Ref } from 'vue'

export interface CrudOptions<T> {
  endpoint: string
  initialData?: T[]
}

export interface CrudState<T> {
  items: Ref<T[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  selectedItem: Ref<T | null>
}

export interface CrudActions<T> {
  fetchAll: () => Promise<void>
  fetchOne: (id: string | number) => Promise<T | null>
  create: (data: Partial<T>) => Promise<T | null>
  update: (id: string | number, data: Partial<T>) => Promise<T | null>
  delete: (id: string | number) => Promise<boolean>
  setSelectedItem: (item: T | null) => void
}

/**
 * Composable reutilizable para operaciones CRUD
 * @param options - Configuración del CRUD (endpoint, datos iniciales)
 * @returns Estado y acciones CRUD
 */
export function useCrud<T extends { id?: string | number }>(
  options: CrudOptions<T>
): CrudState<T> & CrudActions<T> {
  const { endpoint, initialData = [] } = options

  // Estado
  const items = ref<T[]>(initialData) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedItem = ref<T | null>(null) as Ref<T | null>

  // Computeds
  const totalItems = computed(() => items.value.length)

  // Acciones
  const fetchAll = async () => {
    loading.value = true
    error.value = null
    try {
      const response = (await $fetch<T[]>(endpoint)) as T[]
      items.value = response
    } catch (e: any) {
      error.value = e.message || 'Error fetching data'
      console.error('Error fetching all:', e)
    } finally {
      loading.value = false
    }
  }

  const fetchOne = async (id: string | number): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      const response = (await $fetch<T>(`${endpoint}/${id}`)) as T
      selectedItem.value = response
      return response
    } catch (e: any) {
      error.value = e.message || 'Error fetching item'
      console.error('Error fetching one:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  const create = async (data: Partial<T>): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      const response = (await $fetch<T>(endpoint, {
        method: 'POST',
        body: data,
      })) as T
      items.value.push(response)
      return response
    } catch (e: any) {
      error.value = e.message || 'Error creating item'
      console.error('Error creating:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  const update = async (
    id: string | number,
    data: Partial<T>
  ): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      const response = (await $fetch<T>(`${endpoint}/${id}`, {
        method: 'PUT',
        body: data,
      })) as T
      const index = items.value.findIndex((item) => item.id === id)
      if (index !== -1) {
        items.value[index] = response
      }
      return response
    } catch (e: any) {
      error.value = e.message || 'Error updating item'
      console.error('Error updating:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteItem = async (id: string | number): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
      })
      items.value = items.value.filter((item) => item.id !== id)
      return true
    } catch (e: any) {
      error.value = e.message || 'Error deleting item'
      console.error('Error deleting:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  const setSelectedItem = (item: T | null) => {
    selectedItem.value = item
  }

  return {
    // Estado
    items,
    loading,
    error,
    selectedItem,
    // Acciones
    fetchAll,
    fetchOne,
    create,
    update,
    delete: deleteItem,
    setSelectedItem,
  }
}
