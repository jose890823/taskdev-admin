export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  [key: string]: any
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}
