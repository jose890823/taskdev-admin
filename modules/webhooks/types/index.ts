/**
 * Tipos para el modulo de webhooks
 */

export type WebhookEventStatus = 'pending' | 'processing' | 'delivered' | 'failed' | 'retrying'

export interface WebhookEvent {
  id: string
  eventType: string
  status: WebhookEventStatus
  url: string
  payload?: any
  response?: {
    statusCode: number
    body?: any
  }
  attempts: number
  maxAttempts: number
  lastAttemptAt?: string
  nextRetryAt?: string
  deliveredAt?: string
  error?: string
  createdAt: string
  updatedAt: string
}

export interface WebhookStats {
  totalEvents: number
  delivered: number
  failed: number
  pending: number
  retrying: number
  deliveryRate: number
  averageDeliveryTime: number
}

export interface WebhookFilters {
  status?: WebhookEventStatus
  eventType?: string
  page?: number
  limit?: number
}

export interface WebhookEventListResponse {
  success: boolean
  data: {
    events: WebhookEvent[]
    total: number
    page: number
    limit: number
  }
  message?: string
}

export interface WebhookEventResponse {
  success: boolean
  data: WebhookEvent
  message?: string
}

export interface WebhookStatsResponse {
  success: boolean
  data: WebhookStats
  message?: string
}
