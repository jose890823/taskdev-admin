// Security Types - Admin Module

export type SecurityEventType =
  | 'login_failed' | 'login_success' | 'login_blocked'
  | 'rate_limit_exceeded' | 'suspicious_activity'
  | 'password_reset_requested' | 'password_changed'
  | 'account_locked' | 'account_unlocked'
  | 'unauthorized_access' | 'cors_violation'
  | 'bot_detected' | 'scraping_attempt'
  | 'ip_blocked' | 'ip_unblocked'
  | 'session_created' | 'session_revoked'
  | 'admin_action'

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical'
export type SecurityAlertStatus = 'active' | 'investigating' | 'resolved' | 'dismissed'

export type SecurityAlertType =
  | 'brute_force_attack' | 'unusual_traffic' | 'multiple_failed_logins'
  | 'suspicious_ip_pattern' | 'potential_scraping' | 'new_country_login'
  | 'account_takeover_attempt' | 'mass_registration' | 'api_abuse'

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown'

// Security Event (Audit Log)
export interface SecurityEvent {
  id: string
  eventType: SecurityEventType
  severity: SecurityEventSeverity
  ipAddress: string
  userAgent?: string | null
  userId?: string | null
  email?: string | null
  endpoint: string
  method: string
  description: string
  metadata?: Record<string, any>
  country?: string | null
  city?: string | null
  reviewed: boolean
  reviewedById?: string | null
  reviewedAt?: string | null
  notes?: string | null
  createdAt: string
}

// Active Session
export interface ActiveSession {
  id: string
  userId: string
  ipAddress: string
  userAgent?: string | null
  deviceType: DeviceType
  browser?: string | null
  os?: string | null
  country?: string | null
  city?: string | null
  isActive: boolean
  lastActivityAt: string
  expiresAt: string
  createdAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

// Security Alert
export interface SecurityAlert {
  id: string
  alertType: SecurityAlertType
  severity: SecurityEventSeverity
  title: string
  description: string
  relatedUserId?: string | null
  relatedIpAddress?: string | null
  relatedEventIds?: string[] | null
  status: SecurityAlertStatus
  assignedToId?: string | null
  resolvedAt?: string | null
  resolvedById?: string | null
  resolution?: string | null
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Security Config
export interface SecurityConfig {
  id: string
  key: string
  value: string
  valueType: 'string' | 'number' | 'boolean' | 'json'
  description: string
  category: string
  updatedAt: string
  updatedById?: string | null
}

// Blocked IP
export interface BlockedIp {
  ipAddress: string
  reason: string
  permanent: boolean
  expiresAt?: string | null
  blockedAt: string
  blockedById?: string | null
}

// DTOs
export interface SecurityEventFilterDto {
  eventType?: SecurityEventType
  severity?: SecurityEventSeverity
  ipAddress?: string
  reviewed?: boolean
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface ReviewEventDto {
  notes?: string
}

export interface BlockIpDto {
  ipAddress: string
  reason: string
  permanent?: boolean
  durationMinutes?: number
}

export interface UpdateSecurityConfigDto {
  key: string
  value: string
}

export interface CreateSecurityConfigDto {
  key: string
  value: string
  valueType?: 'string' | 'number' | 'boolean' | 'json'
  description: string
  category?: string
}

export interface UpdateAlertStatusDto {
  status: SecurityAlertStatus
  resolution?: string
}

export interface AssignAlertDto {
  assignedToId: string
}

// Dashboard (matches backend security-admin.controller response)
export interface SecurityDashboard {
  events: {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    unreviewed: number
    topIps: { ip: string; count: number }[]
  }
  blockedIps: {
    totalActive: number
    totalPermanent: number
    totalAutoBlocked: number
    totalManualBlocked: number
    recentBlocks: BlockedIp[]
  }
  loginAttempts: {
    total: number
    successful: number
    failed: number
    successRate: number
    topFailedIps: { ip: string; count: number }[]
    topFailedEmails: { email: string; count: number }[]
    failureReasons: Record<string, number>
  }
  alerts: {
    active: Record<string, number>
    recent: SecurityAlert[]
  }
  sessions: {
    totalActive: number
    byDeviceType: Record<string, number>
    byBrowser: Record<string, number>
    byOs: Record<string, number>
    avgSessionAge: number
  }
}

// Responses
export interface SecurityEventListResponse {
  success: boolean
  data: {
    data: SecurityEvent[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
  message: string
}

export interface SecurityDashboardResponse {
  success: boolean
  data: SecurityDashboard
  message: string
}
