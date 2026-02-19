import { ref } from 'vue'
import type {
  Project, ProjectMember, ProjectModule, TaskStatus, ProjectInvitation,
  CreateProjectDto, UpdateProjectDto, CreateModuleDto, CreateStatusDto, AddProjectMemberDto, InviteProjectMemberDto,
} from '../types'
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
  const projectInvitations = ref<ProjectInvitation[]>([])
  const projectModules = ref<ProjectModule[]>([])
  const taskStatuses = ref<TaskStatus[]>([])
  const globalStatuses = ref<TaskStatus[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const headers = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  // ── Projects ──

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

  // ── Members ──

  const fetchMembers = async (projectId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: ProjectMember[] }>(`${getApiUrl()}/projects/${projectId}/members`, { headers: headers() })
      projectMembers.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando miembros'
    }
  }

  const addMember = async (projectId: string, dto: AddProjectMemberDto) => {
    try {
      await $fetch(`${getApiUrl()}/projects/${projectId}/members`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      await fetchMembers(projectId)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error agregando miembro'
      throw e
    }
  }

  const removeMember = async (projectId: string, userId: string) => {
    try {
      await $fetch(`${getApiUrl()}/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: headers(),
      })
      await fetchMembers(projectId)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error eliminando miembro'
      throw e
    }
  }

  const inviteByEmail = async (projectId: string, dto: InviteProjectMemberDto): Promise<{ action: 'added' | 'invited'; message: string } | null> => {
    try {
      const res = await $fetch<{ success: boolean; data: { action: 'added' | 'invited'; message: string } }>(`${getApiUrl()}/projects/${projectId}/invitations`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      if (res.data.action === 'added') {
        await fetchMembers(projectId)
      }
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error invitando miembro'
      throw e
    }
  }

  const fetchProjectInvitations = async (projectId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: ProjectInvitation[] }>(`${getApiUrl()}/projects/${projectId}/invitations`, { headers: headers() })
      projectInvitations.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando invitaciones'
    }
  }

  // ── Modules ──

  const fetchModules = async (projectId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: ProjectModule[] }>(`${getApiUrl()}/projects/${projectId}/modules`, { headers: headers() })
      projectModules.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando modulos'
    }
  }

  const createModule = async (projectId: string, dto: CreateModuleDto) => {
    try {
      const res = await $fetch<{ success: boolean; data: ProjectModule }>(`${getApiUrl()}/projects/${projectId}/modules`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      projectModules.value.push(res.data)
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error creando modulo'
      throw e
    }
  }

  const updateModule = async (moduleId: string, dto: Partial<CreateModuleDto & { position?: number }>) => {
    try {
      const res = await $fetch<{ success: boolean; data: ProjectModule }>(`${getApiUrl()}/project-modules/${moduleId}`, {
        method: 'PATCH',
        body: dto,
        headers: headers(),
      })
      const idx = projectModules.value.findIndex(m => m.id === moduleId)
      if (idx !== -1) projectModules.value[idx] = res.data
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error actualizando modulo'
      throw e
    }
  }

  const deleteModule = async (moduleId: string) => {
    try {
      await $fetch(`${getApiUrl()}/project-modules/${moduleId}`, {
        method: 'DELETE',
        headers: headers(),
      })
      projectModules.value = projectModules.value.filter(m => m.id !== moduleId)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error eliminando modulo'
      throw e
    }
  }

  // ── Task Statuses ──

  const fetchStatuses = async (projectId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: TaskStatus[] }>(`${getApiUrl()}/projects/${projectId}/statuses`, { headers: headers() })
      taskStatuses.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando estados'
    }
  }

  const fetchGlobalStatuses = async () => {
    try {
      const res = await $fetch<{ success: boolean; data: TaskStatus[] }>(`${getApiUrl()}/task-statuses/global`, { headers: headers() })
      globalStatuses.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando estados globales'
    }
  }

  const createStatus = async (projectId: string, dto: CreateStatusDto) => {
    try {
      const res = await $fetch<{ success: boolean; data: TaskStatus }>(`${getApiUrl()}/projects/${projectId}/statuses`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      taskStatuses.value.push(res.data)
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error creando estado'
      throw e
    }
  }

  const updateStatus = async (statusId: string, dto: Partial<{ name: string; color: string; position: number }>) => {
    try {
      const res = await $fetch<{ success: boolean; data: TaskStatus }>(`${getApiUrl()}/task-statuses/${statusId}`, {
        method: 'PATCH',
        body: dto,
        headers: headers(),
      })
      const idx = taskStatuses.value.findIndex(s => s.id === statusId)
      if (idx !== -1) taskStatuses.value[idx] = res.data
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error actualizando estado'
      throw e
    }
  }

  const deleteStatus = async (statusId: string) => {
    try {
      await $fetch(`${getApiUrl()}/task-statuses/${statusId}`, {
        method: 'DELETE',
        headers: headers(),
      })
      taskStatuses.value = taskStatuses.value.filter(s => s.id !== statusId)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error eliminando estado'
      throw e
    }
  }

  return {
    projects,
    currentProject,
    projectMembers,
    projectInvitations,
    projectModules,
    taskStatuses,
    globalStatuses,
    loading,
    error,
    fetchAll,
    fetchBySlug,
    create,
    update,
    remove,
    fetchMembers,
    addMember,
    removeMember,
    inviteByEmail,
    fetchProjectInvitations,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    fetchStatuses,
    fetchGlobalStatuses,
    createStatus,
    updateStatus,
    deleteStatus,
  }
}
