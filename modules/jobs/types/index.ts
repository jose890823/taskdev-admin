/**
 * Tipos para el modulo de Background Jobs
 */

export type JobExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface JobExecution {
  id: string
  jobName: string
  status: JobExecutionStatus
  startedAt?: string
  completedAt?: string
  duration?: number
  result?: any
  error?: string
  data?: any
  createdAt: string
  updatedAt: string
}

export interface JobStatus {
  name: string
  isRunning: boolean
  lastExecution?: {
    id: string
    status: JobExecutionStatus
    startedAt: string
    completedAt?: string
    duration?: number
  }
  nextScheduledRun?: string
  totalExecutions: number
  failedExecutions: number
}

export interface TriggerJobDto {
  jobName: string
  data?: Record<string, any>
}

export interface JobFilters {
  jobName?: string
  status?: JobExecutionStatus
  page?: number
  limit?: number
}

export interface JobExecutionListResponse {
  success: boolean
  data: {
    executions: JobExecution[]
    total: number
    page: number
    limit: number
  }
  message?: string
}

export interface JobStatusResponse {
  success: boolean
  data: JobStatus[]
  message?: string
}
