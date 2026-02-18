/**
 * Tipos para el modulo de traducciones i18n
 */

export type TranslationLocale = 'es' | 'en' | 'fr' | 'pt'

export interface Translation {
  id: string
  systemCode: string
  key: string
  value: string
  locale: TranslationLocale
  module: string
  context: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTranslationDto {
  key: string
  value: string
  locale: TranslationLocale
  module: string
}

export interface UpdateTranslationDto {
  key?: string
  value?: string
  locale?: TranslationLocale
  module?: string
}

export interface ImportTranslationsDto {
  translations: {
    key: string
    value: string
    locale: TranslationLocale
    module?: string
  }[]
}

export interface TranslationFilters {
  search?: string
  locale?: TranslationLocale
  module?: string
  page?: number
  limit?: number
}

export interface TranslationStats {
  total: number
  byLocale: Record<string, number>
  byModule: Record<string, { es: number; en: number; total: number }>
}

export interface TranslationListResponse {
  success: boolean
  data: Translation[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  message?: string
}

export interface TranslationResponse {
  success: boolean
  data: Translation
  message?: string
}
