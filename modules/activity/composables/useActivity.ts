import { ref } from 'vue'
import type { ActivityLog } from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

export const useActivity = () => {
  const { accessToken } = useAuth()
  const activities = ref<ActivityLog[]>([])
  const dailySummary = ref<ActivityLog[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const headers = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  const fetchMy = async (page = 1, limit = 20) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: { data: ActivityLog[]; total: number } }>(`${getApiUrl()}/activity`, {
        headers: headers(),
        params: { page, limit },
      })
      activities.value = res.data.data
      total.value = res.data.total
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando actividad'
    } finally {
      loading.value = false
    }
  }

  const fetchByProject = async (projectId: string, page = 1, limit = 20) => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ success: boolean; data: { data: ActivityLog[]; total: number } }>(`${getApiUrl()}/activity/project/${projectId}`, {
        headers: headers(),
        params: { page, limit },
      })
      activities.value = res.data.data
      total.value = res.data.total
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando actividad del proyecto'
    } finally {
      loading.value = false
    }
  }

  const fetchDailySummary = async (date?: string) => {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, string> = {}
      if (date) params.date = date
      const res = await $fetch<{ success: boolean; data: ActivityLog[] }>(`${getApiUrl()}/activity/daily-summary`, {
        headers: headers(),
        params,
      })
      dailySummary.value = res.data
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error cargando resumen diario'
    } finally {
      loading.value = false
    }
  }

  return {
    activities,
    dailySummary,
    total,
    loading,
    error,
    fetchMy,
    fetchByProject,
    fetchDailySummary,
  }
}
