import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { useAuth } from '~/modules/auth/composables/useAuth'
import type {
  ApiKeyListParams,
  ApiKeyListResponse,
  ApiKeyMetadata,
  ApiKeyPagination,
  ApiKeyResponse,
  ApiKeySecretResult,
  CreateApiKeyDto,
  NormalizedApiKeyListResponse,
  ReplaceApiKeyDto,
} from '../types'

const getApiUrl = () => useRuntimeConfig().public.apiUrl as string
const defaultPagination: ApiKeyPagination = { page: 1, limit: 20, total: 0, totalPages: 0 }
const SAFE_ERROR = 'No se pudo completar la solicitud de forma segura.'

const getErrorMessage = (error: any): string => {
  const message = error?.data?.error?.message || error?.data?.message || error?.message
  if (!message) return 'No se pudo completar la solicitud de la clave API.'
  if (/(?:thk_[\w.-]+|(?:secret|token|authorization|bearer)\s*[:=]\s*\S+)/i.test(message)) return SAFE_ERROR
  return message
}

const normalizeApiKeyListResponse = (
  response: ApiKeyListResponse,
  requestParams: Required<ApiKeyListParams>,
): NormalizedApiKeyListResponse => ({
  ...response,
  pagination: response.pagination ?? {
    page: requestParams.page,
    limit: requestParams.limit,
    total: response.data.length,
    totalPages: response.data.length > 0 ? 1 : 0,
  },
})

export const useApiKeys = () => {
  const { accessToken, refreshAccessToken, logout } = useAuth()
  const apiKeys = ref<ApiKeyMetadata[]>([])
  const currentApiKey = ref<ApiKeyMetadata | null>(null)
  const pagination = ref<ApiKeyPagination>({ ...defaultPagination })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getAuthHeaders = () => ({ Authorization: `Bearer ${accessToken.value}` })

  const fetchWithAuth = async <T>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {},
    retryOnUnauthorized = true,
  ): Promise<T> => {
    try {
      return await $fetch<T>(url, {
        ...options,
        headers: { ...options.headers, ...getAuthHeaders() },
      })
    } catch (requestError: any) {
      if (requestError?.statusCode === 401 && retryOnUnauthorized) {
        let refreshed = false
        try {
          refreshed = await refreshAccessToken()
        } catch {
          refreshed = false
        }
        if (refreshed) return fetchWithAuth<T>(url, options, false)
        await logout()
      }
      throw requestError
    }
  }

  const fetchApiKeys = async (params: ApiKeyListParams = {}) => {
    loading.value = true
    error.value = null
    const requestParams = { page: params.page ?? pagination.value.page, limit: params.limit ?? pagination.value.limit }
    try {
      const response = await fetchWithAuth<ApiKeyListResponse>(`${getApiUrl()}/api-keys`, {
        method: 'GET', params: requestParams,
      })
      if (response.success) {
        const normalizedResponse = normalizeApiKeyListResponse(response, requestParams)
        apiKeys.value = normalizedResponse.data
        pagination.value = normalizedResponse.pagination
        return normalizedResponse
      }
      return response
    } catch (requestError: any) {
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      loading.value = false
    }
  }

  const runMutation = async <T>(operation: () => Promise<T>): Promise<T> => {
    loading.value = true
    error.value = null
    try {
      const result = await operation()
      // Metadata refresh is best-effort: a successful mutation must still expose
      // its one-time secret even if the follow-up list request fails.
      try {
        await fetchApiKeys()
      } catch {
        // fetchApiKeys preserves the safe error state for the page.
      }
      return result
    } catch (requestError: any) {
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      loading.value = false
    }
  }

  const fetchApiKey = async (id: string): Promise<ApiKeyMetadata | null> => {
    loading.value = true
    error.value = null
    try {
      const response = await fetchWithAuth<ApiKeyResponse<ApiKeyMetadata>>(`${getApiUrl()}/api-keys/${id}`, { method: 'GET' })
      if (response.success) currentApiKey.value = response.data
      return response.success ? response.data : null
    } catch (requestError: any) {
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      loading.value = false
    }
  }

  const createApiKey = async (dto: CreateApiKeyDto): Promise<ApiKeySecretResult> => {
    return runMutation(async () => {
      const response = await fetchWithAuth<ApiKeyResponse<ApiKeySecretResult>>(`${getApiUrl()}/api-keys`, { method: 'POST', body: dto })
      return response.data
    })
  }

  const replaceApiKey = async (id: string, dto: ReplaceApiKeyDto): Promise<ApiKeySecretResult> => {
    return runMutation(async () => {
      const response = await fetchWithAuth<ApiKeyResponse<ApiKeySecretResult>>(`${getApiUrl()}/api-keys/${id}/replace`, { method: 'POST', body: dto })
      return response.data
    })
  }

  const revokeApiKey = async (id: string): Promise<ApiKeyMetadata> => {
    return runMutation(async () => {
      const response = await fetchWithAuth<ApiKeyResponse<ApiKeyMetadata>>(`${getApiUrl()}/api-keys/${id}/revoke`, { method: 'POST' })
      return response.data
    })
  }

  return { apiKeys, currentApiKey, pagination, loading, error, fetchApiKeys, fetchApiKey, createApiKey, replaceApiKey, revokeApiKey }
}
