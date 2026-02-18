import { ref } from 'vue'
import type { Project, ProjectMember, ProjectModule, TaskStatus, CreateProjectDto, UpdateProjectDto } from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

export const useProjects = () => {
  const { accessToken } = useAuth()
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const projectMembers = ref<ProjectMember[]>([])
  const projectModules = ref<ProjectModule[]>([])
  const taskStatuses = ref<TaskStatus[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const headers = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  const fetchAll = async (params?: { organizationId?: string; personal?: boolean }) => {
    loading.value = true
    error.value = null
    try {
      const query: Record<string, string> = {}
      if (params?.organizationId) query.organizationId = params.organizationId
      if (params?.personal) query.personal = 'true'

      const res = await $fetch<{ success: boolean; data: Project[] }>(`${getApiUrl()}/projects`, {
        headers: headers(),
        params: query,
      })
      projects.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando proyectos'
    } finally {
      loading.value = false
    }
  }

  const fetchBySlug = async (slug: string) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Project }>(`${getApiUrl()}/projects/by-slug/${slug}`, { headers: headers() })
      currentProject.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando proyecto'
    } finally {
      loading.value = false
    }
  }

  const create = async (dto: CreateProjectDto) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Project }>(`${getApiUrl()}/projects`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      projects.value.push(res.data)
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error creando proyecto'
      return null
    } finally {
      loading.value = false
    }
  }

  const update = async (id: string, dto: UpdateProjectDto) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Project }>(`${getApiUrl()}/projects/${id}`, {
        method: 'PATCH',
        body: dto,
        headers: headers(),
      })
      currentProject.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error actualizando proyecto'
      return null
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: string) => {
    loading.value = true
    try {
      await $fetch(`${getApiUrl()}/projects/${id}`, { method: 'DELETE', headers: headers() })
      projects.value = projects.value.filter(p => p.id !== id)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error eliminando proyecto'
    } finally {
      loading.value = false
    }
  }

  const fetchMembers = async (projectId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: ProjectMember[] }>(`${getApiUrl()}/projects/${projectId}/members`, { headers: headers() })
      projectMembers.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando miembros'
    }
  }

  const fetchModules = async (projectId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: ProjectModule[] }>(`${getApiUrl()}/projects/${projectId}/modules`, { headers: headers() })
      projectModules.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando modulos'
    }
  }

  const fetchStatuses = async (projectId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: TaskStatus[] }>(`${getApiUrl()}/projects/${projectId}/statuses`, { headers: headers() })
      taskStatuses.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando estados'
    }
  }

  return {
    projects,
    currentProject,
    projectMembers,
    projectModules,
    taskStatuses,
    loading,
    error,
    fetchAll,
    fetchBySlug,
    create,
    update,
    remove,
    fetchMembers,
    fetchModules,
    fetchStatuses,
  }
}
