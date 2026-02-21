import { ref } from 'vue'
import type {
  JobExecution,
  JobStatus,
  JobFilters,
  TriggerJobDto,
  JobExecutionListResponse,
  JobStatusResponse,
} from '../types'
import { useAuth } from '~/modules/auth/composables/useAuth'

const getApiUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiUrl as string
}

/**
 * Composable para gestionar Background Jobs
 */
export const useJobs = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()

  // Estado - Ejecuciones
  const executions = ref<JobExecution[]>([])
  const currentExecution = ref<JobExecution | null>(null)

  // Estado - Status de jobs
  const jobStatuses = ref<JobStatus[]>([])

  // Estado compartido
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)

  /**
   * Obtener headers de autenticacion
   */
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${accessToken.value}`,
  })

  /**
   * Ejecutar peticion con manejo de 401 (intenta refrescar token y reintentar)
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

  // ========================
  // Metodos de Ejecuciones
  // ========================

  /**
   * Listar ejecuciones de jobs con filtros y paginacion
   */
  const fetchExecutions = async (filters?: JobFilters) => {
    loading.value = true
    error.value = null

    try {
      const params = {
        page: filters?.page || page.value,
        limit: filters?.limit || limit.value,
        ...(filters?.jobName && { jobName: filters.jobName }),
        ...(filters?.status && { status: filters.status }),
      }

      const response = await fetchWithAuth<JobExecutionListResponse>(`${getApiUrl()}/admin/jobs/executions`, {
        method: 'GET',
        params,
      })

      if (response.success && response.data) {
        executions.value = Array.isArray(response.data.executions) ? response.data.executions : []
        total.value = response.data.total || 0
        page.value = response.data.page || 1
        limit.value = response.data.limit || 10
      } else {
        executions.value = []
        total.value = 0
      }

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener ejecuciones'
      console.error('Error fetching executions:', e)
      executions.value = []
      total.value = 0
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener detalle de una ejecucion por ID
   */
  const fetchExecution = async (id: string): Promise<JobExecution | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; data: JobExecution }>(`${getApiUrl()}/admin/jobs/executions/${id}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        currentExecution.value = response.data
        return response.data
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener ejecucion'
      console.error('Error fetching execution:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ========================
  // Metodos de Status
  // ========================

  /**
   * Obtener estado de todos los jobs del sistema
   */
  const fetchStatus = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<JobStatusResponse>(`${getApiUrl()}/admin/jobs/status`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        jobStatuses.value = Array.isArray(response.data) ? response.data : []
      } else {
        jobStatuses.value = []
      }

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al obtener estado de jobs'
      console.error('Error fetching job statuses:', e)
      jobStatuses.value = []
      throw e
    } finally {
      loading.value = false
    }
  }

  // ========================
  // Acciones
  // ========================

  /**
   * Disparar un job manualmente
   */
  const triggerJob = async (data: TriggerJobDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; data: any; message?: string }>(`${getApiUrl()}/admin/jobs/trigger`, {
        method: 'POST',
        body: data,
      })

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al disparar job'
      console.error('Error triggering job:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Limpiar ejecuciones antiguas
   */
  const cleanupExecutions = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchWithAuth<{ success: boolean; message?: string }>(`${getApiUrl()}/admin/jobs/executions/cleanup`, {
        method: 'DELETE',
      })

      return response
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Error al limpiar ejecuciones'
      console.error('Error cleaning up executions:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ========================
  // Utilidades
  // ========================

  /**
   * Limpiar error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Resetear estado
   */
  const resetState = () => {
    executions.value = []
    currentExecution.value = null
    jobStatuses.value = []
    error.value = null
    total.value = 0
    page.value = 1
  }

  return {
    // Estado
    executions,
    currentExecution,
    jobStatuses,
    loading,
    error,
    total,
    page,
    limit,
    // Metodos de Ejecuciones
    fetchExecutions,
    fetchExecution,
    // Metodos de Status
    fetchStatus,
    // Acciones
    triggerJob,
    cleanupExecutions,
    // Utilidades
    clearError,
    resetState,
  }
}
