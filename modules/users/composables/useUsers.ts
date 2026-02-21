import { ref } from 'vue'
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UserFilters,
  UserListResponse,
  UserResponse,
} from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

/**
 * Composable para gestionar usuarios
 */
export const useUsers = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  // Estado
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)

  /**
   * Obtener headers de autenticación
   */
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  /**
   * Ejecutar petición con manejo de 401 (intenta refrescar token y reintentar)
   */
  const fetchWithAuth = async <T>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {},
    retryOnUnauthorized = true
  ): Promise<T> => {
    try {
      const response = await $fetch<T>(url, {
        ...options,
        headers: {
          ...options.headers,
          ...getAuthHeaders(),
        },
      })
      return response as T
    } catch (e: any) {
      if (e.statusCode === 401 && retryOnUnauthorized) {
        const refreshed = await refreshAccessToken()

        if (refreshed) {
          return await fetchWithAuth<T>(url, options, false)
        }

        await logout()
      }
      throw e
    }
  }

  /**
   * Listar usuarios con filtros y paginación
   */
  const fetchUsers = async (filters?: UserFilters) => {
    loading.value = true
    error.value = null

    try {
      const params = {
        page: filters?.page || page.value,
        limit: filters?.limit || limit.value,
        ...(filters?.search && { search: filters.search }),
        ...(filters?.role && { role: filters.role }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      }

      const response = await fetchWithAuth<UserListResponse>(`${getApiUrl()}/users/admin/all`, {
        method: 'GET',
        params,
      })

      if (response.success && response.data) {
        let usersData = Array.isArray(response.data) ? response.data : []

        if (filters?.excludeSuperAdmin) {
          usersData = usersData.filter((u: User) => !u.roles?.includes('super_admin'))
        }

        users.value = usersData
        total.value = (response as any).pagination?.total || usersData.length
        page.value = (response as any).pagination?.page || 1
        limit.value = (response as any).pagination?.limit || 10
      } else {
        users.value = []
        total.value = 0
      }

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener usuarios'
      console.error('Error fetching users:', e)
      users.value = []
      total.value = 0
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener un usuario por ID
   */
  const fetchUser = async (id: string): Promise<User | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<UserResponse>(`${getApiUrl()}/users/admin/${id}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        currentUser.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener usuario'
      console.error('Error fetching user:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Crear un nuevo usuario
   */
  const createUser = async (data: CreateUserDto): Promise<User | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; data: { user: User; message: string } }>(`${getApiUrl()}/auth/register`, {
        method: 'POST',
        body: data,
      })

      if (response.success && response.data?.user) {
        users.value.unshift(response.data.user)
        total.value += 1
        return response.data.user
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al crear usuario'
      console.error('Error creating user:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualizar un usuario
   */
  const updateUser = async (id: string, data: UpdateUserDto): Promise<User | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<UserResponse>(`${getApiUrl()}/users/admin/${id}`, {
        method: 'PUT',
        body: data,
      })

      if (response.success && response.data) {
        const index = users.value.findIndex((u) => u.id === id)
        if (index !== -1) {
          users.value[index] = response.data
        }
        currentUser.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al actualizar usuario'
      console.error('Error updating user:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Eliminar un usuario
   */
  const deleteUser = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; message?: string }>(
        `${getApiUrl()}/users/admin/${id}`,
        {
          method: 'DELETE',
        }
      )

      if (response.success) {
        users.value = users.value.filter((u) => u.id !== id)
        total.value -= 1
        return true
      }

      return false
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al eliminar usuario'
      console.error('Error deleting user:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Buscar usuarios (Admin)
   */
  const searchUsers = async (query: string, searchLimit: number = 10) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/users/admin/search`, {
        method: 'GET',
        params: { q: query, limit: searchLimit },
      })

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al buscar usuarios'
      console.error('Error searching users:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Activar/Desactivar usuario (Admin)
   */
  const toggleActive = async (id: string, isActive: boolean) => {
    loading.value = true
    error.value = null

    try {
      const endpoint = isActive ? 'activate' : 'deactivate'
      const response = await fetchWithAuth<UserResponse>(`${getApiUrl()}/users/admin/${id}/${endpoint}`, {
        method: 'PATCH',
      })

      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1 && response.data) {
        users.value[index] = response.data
      }

      return response.data
    } catch (e: any) {
      error.value = e.data?.message || e.message || `Error al ${isActive ? 'activar' : 'desactivar'} usuario`
      console.error('Error toggling active:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Cambiar rol del usuario (Solo Super Admin)
   */
  const updateRole = async (id: string, role: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<UserResponse>(`${getApiUrl()}/users/admin/${id}/role`, {
        method: 'PATCH',
        body: { role },
      })

      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1 && response.data) {
        users.value[index] = response.data
      }

      return response.data
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al cambiar rol del usuario'
      console.error('Error updating role:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  const getStats = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/users/admin/stats`, {
        method: 'GET',
      })
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener estadísticas'
      console.error('Error fetching stats:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener actividad de un usuario
   */
  const getUserActivity = async (userId: string, limitCount: number = 20, offset: number = 0) => {
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/users/admin/${userId}/activity`, {
        method: 'GET',
        params: { limit: limitCount, offset },
      })
      return response
    } catch (e: any) {
      console.error('Error fetching user activity:', e)
      throw e
    }
  }

  /**
   * Obtener estadísticas de actividad de un usuario
   */
  const getUserActivityStats = async (userId: string) => {
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/users/admin/${userId}/activity/stats`, {
        method: 'GET',
      })
      return response
    } catch (e: any) {
      console.error('Error fetching user activity stats:', e)
      throw e
    }
  }

  /**
   * Limpiar estado
   */
  const clearError = () => {
    error.value = null
  }

  const resetState = () => {
    users.value = []
    currentUser.value = null
    error.value = null
    total.value = 0
    page.value = 1
  }

  return {
    // Estado
    users,
    currentUser,
    loading,
    error,
    total,
    page,
    limit,
    // Métodos
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    toggleActive,
    updateRole,
    getStats,
    getUserActivity,
    getUserActivityStats,
    clearError,
    resetState,
  }
}
