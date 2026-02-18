import { ref } from 'vue'
import type { Organization, OrganizationMember, Invitation, CreateOrganizationDto, UpdateOrganizationDto, CreateInvitationDto, AddMemberDto } from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

export const useOrganizations = () => {
  const { accessToken } = useAuth()
  const organizations = ref<Organization[]>([])
  const currentOrg = ref<Organization | null>(null)
  const members = ref<OrganizationMember[]>([])
  const invitations = ref<Invitation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const headers = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  const fetchAll = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Organization[] }>(`${getApiUrl()}/organizations`, { headers: headers() })
      organizations.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando organizaciones'
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Organization }>(`${getApiUrl()}/organizations/${id}`, { headers: headers() })
      currentOrg.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando organizacion'
    } finally {
      loading.value = false
    }
  }

  const create = async (dto: CreateOrganizationDto) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Organization }>(`${getApiUrl()}/organizations`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      organizations.value.push(res.data)
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error creando organizacion'
      return null
    } finally {
      loading.value = false
    }
  }

  const update = async (id: string, dto: UpdateOrganizationDto) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: Organization }>(`${getApiUrl()}/organizations/${id}`, {
        method: 'PATCH',
        body: dto,
        headers: headers(),
      })
      currentOrg.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error actualizando organizacion'
      return null
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: string) => {
    loading.value = true
    try {
      await $fetch(`${getApiUrl()}/organizations/${id}`, { method: 'DELETE', headers: headers() })
      organizations.value = organizations.value.filter(o => o.id !== id)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error eliminando organizacion'
    } finally {
      loading.value = false
    }
  }

  const fetchMembers = async (orgId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: OrganizationMember[] }>(`${getApiUrl()}/organizations/${orgId}/members`, { headers: headers() })
      members.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando miembros'
    }
  }

  const addMember = async (orgId: string, dto: AddMemberDto) => {
    try {
      await $fetch(`${getApiUrl()}/organizations/${orgId}/members`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      await fetchMembers(orgId)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error agregando miembro'
    }
  }

  const fetchInvitations = async (orgId: string) => {
    try {
      const res = await $fetch<{ success: boolean; data: Invitation[] }>(`${getApiUrl()}/organizations/${orgId}/invitations`, { headers: headers() })
      invitations.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando invitaciones'
    }
  }

  const createInvitation = async (orgId: string, dto: CreateInvitationDto) => {
    try {
      await $fetch(`${getApiUrl()}/organizations/${orgId}/invitations`, {
        method: 'POST',
        body: dto,
        headers: headers(),
      })
      await fetchInvitations(orgId)
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error creando invitacion'
    }
  }

  return {
    organizations,
    currentOrg,
    members,
    invitations,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    fetchMembers,
    addMember,
    fetchInvitations,
    createInvitation,
  }
}
