import { ref } from 'vue'
import type {
  SecurityDashboard,
  SecurityEvent,
  SecurityAlert,
  SecurityConfig,
  BlockedIp,
  SecurityEventFilterDto,
  ReviewEventDto,
  BlockIpDto,
  UpdateSecurityConfigDto,
  CreateSecurityConfigDto,
  UpdateAlertStatusDto,
  SecurityDashboardResponse,
  SecurityEventListResponse,
} from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

export const useSecurity = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  const dashboard = ref<SecurityDashboard | null>(null)
  const events = ref<SecurityEvent[]>([])
  const alerts = ref<SecurityAlert[]>([])
  const configs = ref<SecurityConfig[]>([])
  const blockedIps = ref<BlockedIp[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  const fetchWithAuth = async <T>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {},
    retryOnUnauthorized = true
  ): Promise<T> => {
    try {
      const response = await $fetch<T>(url, {
        ...options,
        headers: { ...options.headers, ...getAuthHeaders() },
      })
      return response as T
    } catch (e: any) {
      if (e.statusCode === 401 && retryOnUnauthorized) {
        const refreshed = await refreshAccessToken()
        if (refreshed) return await fetchWithAuth<T>(url, options, false)
        await logout()
      }
      throw e
    }
  }

  // Dashboard
  const getDashboard = async (): Promise<SecurityDashboard | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<SecurityDashboardResponse>(`${getApiUrl()}/admin/security/dashboard`, { method: 'GET' })
      if (response.success && response.data) {
        dashboard.value = response.data
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener dashboard de seguridad'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Events
  const fetchEvents = async (filters?: SecurityEventFilterDto) => {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, any> = {
        page: filters?.page || page.value,
        limit: filters?.limit || limit.value,
        ...(filters?.eventType && { eventType: filters.eventType }),
        ...(filters?.severity && { severity: filters.severity }),
        ...(filters?.ipAddress && { ipAddress: filters.ipAddress }),
        ...(filters?.reviewed !== undefined && { reviewed: filters.reviewed }),
        ...(filters?.fromDate && { fromDate: filters.fromDate }),
        ...(filters?.toDate && { toDate: filters.toDate }),
        ...(filters?.sortBy && { sortBy: filters.sortBy }),
        ...(filters?.sortOrder && { sortOrder: filters.sortOrder }),
      }
      const response = await fetchWithAuth<SecurityEventListResponse>(`${getApiUrl()}/admin/security/events`, { method: 'GET', params })
      if (response.success && response.data) {
        events.value = Array.isArray(response.data) ? response.data : []
        total.value = response.pagination?.total || response.data?.length || 0
        page.value = response.pagination?.page || 1
      } else {
        events.value = []
        total.value = 0
      }
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener eventos'
      events.value = []
      throw e
    } finally {
      loading.value = false
    }
  }

  const reviewEvent = async (id: string, data: ReviewEventDto) => {
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/security/events/${id}/review`, { method: 'PATCH', body: data })
      if (response.success && response.data) {
        const index = events.value.findIndex((e) => e.id === id)
        if (index !== -1) events.value[index] = response.data
      }
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al revisar evento'
      throw e
    }
  }

  // Blocked IPs
  const fetchBlockedIps = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/security/blocked-ips`, { method: 'GET' })
      if (response.success && response.data) {
        blockedIps.value = Array.isArray(response.data) ? response.data : []
      }
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener IPs bloqueadas'
      throw e
    } finally {
      loading.value = false
    }
  }

  const blockIp = async (data: BlockIpDto) => {
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/security/blocked-ips`, { method: 'POST', body: data })
      if (response.success) await fetchBlockedIps()
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al bloquear IP'
      throw e
    }
  }

  const unblockIp = async (ip: string) => {
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/security/blocked-ips/${encodeURIComponent(ip)}`, { method: 'DELETE' })
      blockedIps.value = blockedIps.value.filter((b) => b.ipAddress !== ip)
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al desbloquear IP'
      throw e
    }
  }

  // Config
  const fetchConfigs = async (category?: string) => {
    loading.value = true
    error.value = null
    try {
      const url = category ? `${getApiUrl()}/admin/security/config/${category}` : `${getApiUrl()}/admin/security/config`
      const response = await fetchWithAuth<any>(url, { method: 'GET' })
      if (response.success && response.data) {
        configs.value = Array.isArray(response.data) ? response.data : []
      }
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener configuraciones'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateConfig = async (data: UpdateSecurityConfigDto) => {
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/security/config`, { method: 'PATCH', body: data })
      if (response.success && response.data) {
        const index = configs.value.findIndex((c) => c.key === data.key)
        if (index !== -1) configs.value[index] = response.data
      }
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al actualizar configuración'
      throw e
    }
  }

  // Alerts
  const fetchAlerts = async (filters?: { status?: string; severity?: string }) => {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, any> = {}
      if (filters?.status) params.status = filters.status
      if (filters?.severity) params.severity = filters.severity
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/security/alerts`, { method: 'GET', params })
      if (response.success && response.data) {
        alerts.value = Array.isArray(response.data) ? response.data : []
      }
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener alertas'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateAlertStatus = async (id: string, data: UpdateAlertStatusDto) => {
    try {
      const response = await fetchWithAuth<any>(`${getApiUrl()}/admin/security/alerts/${id}/status`, { method: 'PATCH', body: data })
      if (response.success && response.data) {
        const index = alerts.value.findIndex((a) => a.id === id)
        if (index !== -1) alerts.value[index] = response.data
      }
      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al actualizar alerta'
      throw e
    }
  }

  // Sessions
  const revokeUserSessions = async (userId: string) => {
    try {
      return await fetchWithAuth<any>(`${getApiUrl()}/admin/security/sessions/user/${userId}`, { method: 'DELETE' })
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al revocar sesiones'
      throw e
    }
  }

  // Maintenance
  const runCleanup = async () => {
    try {
      return await fetchWithAuth<any>(`${getApiUrl()}/admin/security/maintenance/cleanup`, { method: 'POST' })
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al ejecutar limpieza'
      throw e
    }
  }

  const clearError = () => { error.value = null }

  return {
    dashboard,
    events,
    alerts,
    configs,
    blockedIps,
    loading,
    error,
    total,
    page,
    limit,
    getDashboard,
    fetchEvents,
    reviewEvent,
    fetchBlockedIps,
    blockIp,
    unblockIp,
    fetchConfigs,
    updateConfig,
    fetchAlerts,
    updateAlertStatus,
    revokeUserSessions,
    runCleanup,
    clearError,
  }
}
