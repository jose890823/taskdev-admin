/**
 * Tipos para el modulo de autenticacion
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
  emailVerified: boolean
  phoneVerified: boolean
  isActive: boolean
  profilePhotoUrl?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export function userHasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false
  return user.roles?.includes(role) ?? false
}

export function userHasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false
  return roles.some(role => userHasRole(user, role))
}

export function userIsAdmin(user: User | null): boolean {
  return userHasRole(user, 'super_admin')
}

export function userIsSuperAdmin(user: User | null): boolean {
  return userHasRole(user, 'super_admin')
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
    user: User
  }
  message: string
}

export interface RegisterDto {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
}

export interface VerifyEmailDto {
  email: string
  otpCode: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
}
