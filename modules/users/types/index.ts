/**
 * Tipos para el modulo de usuarios
 */

export type UserRole = 'user' | 'super_admin'

export interface User {
  id: string
  systemCode?: string
  email: string
  firstName: string
  lastName: string
  phone: string
  roles: UserRole[]
  businessId?: string | null
  emailVerified: boolean
  phoneVerified: boolean
  isActive: boolean
  isSystemUser?: boolean
  profilePhotoUrl?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  roles?: UserRole[]
  businessId?: string
  isActive?: boolean
}

export interface UpdateUserDto {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  phone?: string
  roles?: UserRole[]
  businessId?: string | null
  isActive?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
}

export interface UserFilters {
  search?: string
  role?: string
  isActive?: boolean
  page?: number
  limit?: number
  excludeSuperAdmin?: boolean
}

export interface UserListResponse {
  success: boolean
  data: {
    users: User[]
    total: number
    page: number
    limit: number
  }
  message?: string
}

export interface UserResponse {
  success: boolean
  data: User
  message?: string
}
