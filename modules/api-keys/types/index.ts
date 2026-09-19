export type ApiKeyStatus = 'active' | 'expired' | 'revoked'
export type ApiKeyExpiryDays = 30 | 90 | 180 | 365
export type ApiKeyScope =
  | 'tasks:read'
  | 'tasks:write'
  | 'comments:read'
  | 'comments:write'
  | 'notifications:read'
  | 'notifications:write'
  | 'activity:read'
  | 'search:read'
  | 'projects:read'
  | 'projects:write'
  | 'project-members:read'
  | 'project-members:write'
  | 'project-modules:read'
  | 'project-modules:write'
  | 'task-statuses:read'
  | 'task-statuses:write'
  | 'organizations:read'
  | 'invitations:read'
  | 'invitations:write'

export const API_KEY_SCOPES: readonly ApiKeyScope[] = [
  'tasks:read',
  'tasks:write',
  'comments:read',
  'comments:write',
  'notifications:read',
  'notifications:write',
  'activity:read',
  'search:read',
  'projects:read',
  'projects:write',
  'project-members:read',
  'project-members:write',
  'project-modules:read',
  'project-modules:write',
  'task-statuses:read',
  'task-statuses:write',
  'organizations:read',
  'invitations:read',
  'invitations:write',
]

export const API_KEY_EXPIRY_DAYS: readonly ApiKeyExpiryDays[] = [30, 90, 180, 365]

export interface ApiKeyOwnerSummary {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface ApiKeyProjectSummary {
  id: string
  name: string
  slug: string
}

export interface ApiKeyMetadata {
  id: string
  name: string
  ownerId: string
  projectId: string
  owner?: ApiKeyOwnerSummary
  project?: ApiKeyProjectSummary
  scopes: ApiKeyScope[]
  createdAt: string
  lastUsedAt?: string | null
  expiresAt: string
  status: ApiKeyStatus
  revokedAt?: string | null
}

export interface ApiKeySecretResult {
  key: ApiKeyMetadata
  secret: string
}

export interface ApiKeyPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiKeyListResponse {
  success: boolean
  data: ApiKeyMetadata[]
  pagination?: ApiKeyPagination | null
  message?: string
}

export type NormalizedApiKeyListResponse = Omit<ApiKeyListResponse, 'pagination'> & {
  pagination: ApiKeyPagination
}

export interface ApiKeyResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface CreateApiKeyDto {
  name: string
  projectId: string
  scopes: ApiKeyScope[]
  expirationDays: ApiKeyExpiryDays
  ownerId?: string
}

export interface ReplaceApiKeyDto {
  name: string
  projectId: string
  scopes: ApiKeyScope[]
  expirationDays: ApiKeyExpiryDays
  ownerId?: string
}

export interface ApiKeyListParams {
  page?: number
  limit?: number
}
