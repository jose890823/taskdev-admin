import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useApiKeys } from '~/modules/api-keys/composables/useApiKeys'
import type {
  ApiKeyMetadata,
  ApiKeyListResponse,
  ApiKeySecretResult,
  ApiKeyScope,
} from '~/modules/api-keys/types'

const fetchMock = vi.hoisted(() => vi.fn())
const refreshAccessToken = vi.hoisted(() => vi.fn())
const logout = vi.hoisted(() => vi.fn())
const accessToken = vi.hoisted(() => ({ value: 'initial-jwt' }))

vi.mock('~/modules/auth/composables/useAuth', () => ({
  useAuth: () => ({ accessToken, refreshAccessToken, logout }),
}))

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({ public: { apiUrl: 'https://api.test/api' } }),
}))

const metadata: ApiKeyMetadata = {
  id: 'key-1',
  name: 'Task reader',
  ownerId: 'user-1',
  projectId: 'project-1',
  owner: { id: 'user-1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test' },
  project: { id: 'project-1', name: 'TaskHub', slug: 'taskhub' },
  scopes: ['tasks:read'],
  createdAt: '2026-09-16T10:00:00.000Z',
  lastUsedAt: null,
  expiresAt: '2026-12-15T10:00:00.000Z',
  status: 'active',
  revokedAt: null,
}

const listResponse = (items: ApiKeyMetadata[] = [metadata]): ApiKeyListResponse => ({
  success: true,
  data: items,
  pagination: { page: 1, limit: 20, total: items.length, totalPages: 1 },
})

beforeEach(() => {
  vi.clearAllMocks()
  accessToken.value = 'initial-jwt'
  vi.stubGlobal('$fetch', fetchMock)
})

describe('useApiKeys lifecycle contract', () => {
  it('uses JWT metadata endpoints and typed envelopes for list and detail', async () => {
    const detailResponse = { success: true, data: metadata }
    fetchMock
      .mockResolvedValueOnce(listResponse())
      .mockResolvedValueOnce(detailResponse)
    const apiKeys = useApiKeys()

    await apiKeys.fetchApiKeys()
    const detail = await apiKeys.fetchApiKey('key-1')

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://api.test/api/api-keys', {
      method: 'GET',
      headers: { Authorization: 'Bearer initial-jwt' },
      params: { page: 1, limit: 20 },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://api.test/api/api-keys/key-1', {
      method: 'GET',
      headers: { Authorization: 'Bearer initial-jwt' },
    })
    expect(apiKeys.apiKeys.value).toEqual([metadata])
    expect(detail).toEqual(metadata)
    expect(detail).not.toHaveProperty('secret')
  })

  it('normalizes a missing pagination field from the request and returned data', async () => {
    fetchMock
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: true, data: [metadata] })
    const apiKeys = useApiKeys()

    const emptyResponse = await apiKeys.fetchApiKeys({ page: 1, limit: 20 })
    const populatedResponse = await apiKeys.fetchApiKeys({ page: 2, limit: 10 })

    expect(emptyResponse.pagination).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 })
    expect(populatedResponse.pagination).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 })
    expect(apiKeys.pagination.value).toEqual(populatedResponse.pagination)
  })

  it('accepts list metadata with ownerId and projectId without nested summaries', async () => {
    const metadataWithoutNestedSummaries: ApiKeyMetadata = {
      id: 'key-with-ids-only',
      name: 'IDs only',
      ownerId: 'owner-1',
      projectId: 'project-1',
      scopes: ['tasks:read'],
      createdAt: '2026-09-16T10:00:00.000Z',
      lastUsedAt: null,
      expiresAt: '2026-12-15T10:00:00.000Z',
      status: 'active',
      revokedAt: null,
    }
    fetchMock.mockResolvedValueOnce(listResponse([metadataWithoutNestedSummaries]))
    const apiKeys = useApiKeys()

    const response = await apiKeys.fetchApiKeys()

    expect(response.data).toEqual([metadataWithoutNestedSummaries])
    expect(apiKeys.apiKeys.value).toEqual([metadataWithoutNestedSummaries])
  })

  it('sends verified create, replace, and revoke bodies and refreshes metadata after mutations', async () => {
    const secretResult: ApiKeySecretResult = { key: metadata, secret: 'one-time-secret' }
    fetchMock
      .mockResolvedValueOnce(secretResultEnvelope(secretResult))
      .mockResolvedValueOnce(listResponse())
      .mockResolvedValueOnce(secretResultEnvelope(secretResult))
      .mockResolvedValueOnce(listResponse())
      .mockResolvedValueOnce({ success: true, data: metadata })
      .mockResolvedValueOnce(listResponse())
    const apiKeys = useApiKeys()
    const input = { name: 'Task reader', projectId: 'project-1', scopes: ['tasks:read'] as ApiKeyScope[], expirationDays: 90 as const }

    await apiKeys.createApiKey(input)
    await apiKeys.replaceApiKey('key-1', input)
    await apiKeys.revokeApiKey('key-1')

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://api.test/api/api-keys', {
      method: 'POST', body: input, headers: { Authorization: 'Bearer initial-jwt' },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'https://api.test/api/api-keys/key-1/replace', {
      method: 'POST', body: input, headers: { Authorization: 'Bearer initial-jwt' },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(5, 'https://api.test/api/api-keys/key-1/revoke', {
      method: 'POST', headers: { Authorization: 'Bearer initial-jwt' },
    })
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('returns a successful mutation secret when best-effort metadata refetch fails', async () => {
    const createResult: ApiKeySecretResult = { key: metadata, secret: 'thk_create_secret' }
    const replaceResult: ApiKeySecretResult = { key: metadata, secret: 'thk_replace_secret' }
    fetchMock
      .mockResolvedValueOnce(secretResultEnvelope(createResult))
      .mockRejectedValueOnce({ data: { error: { message: 'secret=thk_refetch_failure' } } })
      .mockResolvedValueOnce(secretResultEnvelope(replaceResult))
      .mockRejectedValueOnce({ data: { error: { message: 'secret=thk_refetch_failure' } } })
    const apiKeys = useApiKeys()
    const input = { name: 'Task reader', projectId: 'project-1', scopes: ['tasks:read'] as ApiKeyScope[], expirationDays: 90 as const }

    await expect(apiKeys.createApiKey(input)).resolves.toEqual(createResult)
    await expect(apiKeys.replaceApiKey('key-1', input)).resolves.toEqual(replaceResult)

    expect(apiKeys.loading.value).toBe(false)
    expect(apiKeys.error.value).toBe('No se pudo completar la solicitud de forma segura.')
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('preserves distinct server-authorized list responses for user and superadmin sessions', async () => {
    const ownedKey = { ...metadata, id: 'owned-key', owner: metadata.owner }
    const visibleKey = { ...metadata, id: 'other-owner-key', owner: { ...metadata.owner, id: 'other-owner' } }
    fetchMock
      .mockResolvedValueOnce(listResponse([ownedKey]))
      .mockResolvedValueOnce(listResponse([ownedKey, visibleKey]))

    const userApiKeys = useApiKeys()
    await userApiKeys.fetchApiKeys()
    accessToken.value = 'superadmin-jwt'
    const superadminApiKeys = useApiKeys()
    await superadminApiKeys.fetchApiKeys()

    expect(userApiKeys.apiKeys.value).toEqual([ownedKey])
    expect(superadminApiKeys.apiKeys.value).toEqual([ownedKey, visibleKey])
  })

  it('refreshes once after a 401 and retries with the new JWT', async () => {
    refreshAccessToken.mockImplementationOnce(async () => {
      accessToken.value = 'refreshed-jwt'
      return true
    })
    fetchMock.mockRejectedValueOnce({ statusCode: 401 }).mockResolvedValueOnce(listResponse())
    const apiKeys = useApiKeys()

    await apiKeys.fetchApiKeys()

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://api.test/api/api-keys', {
      method: 'GET', headers: { Authorization: 'Bearer refreshed-jwt' }, params: { page: 1, limit: 20 },
    })
  })

  it('logs out and does not retry when refresh fails, while redacting unsafe errors', async () => {
    refreshAccessToken.mockResolvedValueOnce(false)
    fetchMock.mockRejectedValueOnce({
      statusCode: 401,
      data: { error: { message: 'invalid thk_public_secret-value secret=one-time-secret' } },
    })
    const apiKeys = useApiKeys()

    await expect(apiKeys.fetchApiKeys()).rejects.toMatchObject({ statusCode: 401 })

    expect(logout).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(apiKeys.error.value).toBe('No se pudo completar la solicitud de forma segura.')
    expect(apiKeys.error.value).not.toContain('thk_public_secret-value')
    expect(apiKeys.error.value).not.toContain('one-time-secret')
  })
})

function secretResultEnvelope(data: ApiKeySecretResult) {
  return { success: true, data }
}
