/**
 * Tipos para el modulo de Feature Flags
 */

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  isEnabled: boolean
  enabledForRoles?: string[]
  enabledForStores?: string[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateFeatureFlagDto {
  key: string
  name: string
  description?: string
  isEnabled?: boolean
  enabledForRoles?: string[]
  enabledForStores?: string[]
  metadata?: Record<string, any>
}

export interface UpdateFeatureFlagDto extends Partial<CreateFeatureFlagDto> {}

export interface FeatureFlagFilters {
  search?: string
  isEnabled?: boolean
  page?: number
  limit?: number
}

export interface FeatureFlagListResponse {
  success: boolean
  data: FeatureFlag[]
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
  }
}

export interface FeatureFlagResponse {
  success: boolean
  data: FeatureFlag
  message?: string
}
