import { ref } from 'vue'
import type { Task, Comment, CreateTaskDto, UpdateTaskDto, CreateCommentDto, TaskType } from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

export const useTasks = () => {
  const { accessToken } = useAuth()
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const subtasks = ref<Task[]>([])
  const comments = ref<Comment[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const headers = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  const fetchAll = async (filters?: {
    projectId?: string
    organizationId?: string
    statusId?: string
    assignedToId?: string
    type?: TaskType
    page?: number
    limit?: number
  }) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: { data: Task[]; total: number } }>(`${getApiUrl()}/tasks`, {
        headers: headers(),
        params: filters,
      })
      tasks.value = res.data.data
      total.value = res.data.total
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando tareas'
    } finally {
      loading.value = false
    }
  }

  const fetchMyTasks = async (type?: TaskType) => {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, string> = {}
      if (type) params.type = type
      const res = await $fetch<{ success: boolean; data: Task[] }>(`${getApiUrl()}/tasks/my`, {
        headers: headers(),
        params,
      })
      tasks.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando tareas'
    } finally {
      loading.value = false
    }
  }

  const fetchDailyTasks = async (date?: string) => {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, string> = {}
      if (date) params.date = date
      const res = await $fetch<{ success: boolean; data: Task[] }>(`${getApiUrl()}/tasks/daily`, {
        headers: headers(),
        params,
      })
      tasks.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando tareas diarias'
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Task }>(`${getApiUrl()}/tasks/${id}`, { headers: headers() })
      currentTask.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando tarea'
    } finally {
      loading.value = false
    }
  }

  const create = async (dto: CreateTaskDto) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Task }>(`${getApiUrl()}/tasks`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      tasks.value.push(res.data)
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error creando tarea'
      return null
    } finally {
      loading.value = false
    }
  }

  const update = async (id: string, dto: UpdateTaskDto) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Task }>(`${getApiUrl()}/tasks/${id}`, {
        method: 'PATCH',
        body: dto,
        headers: headers(),
      })
      currentTask.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error actualizando tarea'
      return null
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: string) => {
    loading.value = true
    try {
      await $fetch(`${getApiUrl()}/tasks/${id}`, { method: 'DELETE', headers: headers() })
      tasks.value = tasks.value.filter(t => t.id !== id)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error eliminando tarea'
    } finally {
      loading.value = false
    }
  }

  const fetchSubtasks = async (taskId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: Task[] }>(`${getApiUrl()}/tasks/${taskId}/subtasks`, { headers: headers() })
      subtasks.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando subtareas'
    }
  }

  const fetchComments = async (taskId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: Comment[] }>(`${getApiUrl()}/comments/task/${taskId}`, { headers: headers() })
      comments.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando comentarios'
    }
  }

  const addComment = async (dto: CreateCommentDto) => {
    try {
      await $fetch(`${getApiUrl()}/comments`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      await fetchComments(dto.taskId)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error creando comentario'
    }
  }

  return {
    tasks,
    currentTask,
    subtasks,
    comments,
    total,
    loading,
    error,
    fetchAll,
    fetchMyTasks,
    fetchDailyTasks,
    fetchById,
    create,
    update,
    remove,
    fetchSubtasks,
    fetchComments,
    addComment,
  }
}
