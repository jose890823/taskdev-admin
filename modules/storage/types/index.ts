// Storage Types - Admin Module

export type StorageProviderType = 'local' | 's3' | 'gcs' | 'cloudinary'

export interface StorageConfig {
  id: string
  provider: StorageProviderType
  name?: string | null
  isActive: boolean
  isConfigured: boolean
  lastValidatedAt?: string | null
  lastValidationError?: string | null
  config: Record<string, any>
  settings: StorageSettings
  createdAt: string
  updatedAt: string
}

export interface StorageSettings {
  maxFileSize?: number
  allowedMimeTypes?: string[]
  defaultPublic?: boolean
  urlExpiration?: number
  pathPrefix?: string
}

export interface StorageTestResult {
  success: boolean
  message: string
  responseTime?: number
  details?: {
    provider: StorageProviderType
    testedAt: string
  }
}

export interface StorageStats {
  activeProvider: StorageProviderType | null
  usage: {
    used: number
    total?: number
    available?: number
  }
  isHealthy: boolean
}

// DTOs
export interface UpdateStorageConfigDto {
  name?: string
  config?: Record<string, any>
  settings?: Partial<StorageSettings>
}

// Responses
export interface StorageProvidersListResponse {
  success: boolean
  data: {
    providers: StorageConfig[]
    activeProvider: StorageProviderType | null
  }
  message: string
}

export interface StorageConfigResponse {
  success: boolean
  data: StorageConfig
  message: string
}

export interface StorageTestResponse {
  success: boolean
  data: StorageTestResult
  message: string
}

export interface StorageStatsResponse {
  success: boolean
  data: StorageStats
  message: string
}

// Provider config shapes for forms
export interface S3ConfigFields {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string
  forcePathStyle?: boolean
}

export interface GCSConfigFields {
  projectId: string
  bucket: string
  keyFilename?: string
}

export interface CloudinaryConfigFields {
  cloudName: string
  apiKey: string
  apiSecret: string
  folder?: string
}

export interface LocalConfigFields {
  basePath: string
  baseUrl: string
  serveStatic?: boolean
}
