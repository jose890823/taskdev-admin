export type ActivityType =
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_status_changed'
  | 'task_assigned'
  | 'comment_added'
  | 'member_added'
  | 'member_removed'
  | 'project_created'
  | 'project_updated'
  | 'invitation_sent'
  | 'invitation_accepted'

export interface ActivityLog {
  id: string
  userId: string
  organizationId?: string | null
  projectId?: string | null
  taskId?: string | null
  type: ActivityType
  description: string
  metadata?: Record<string, any> | null
  createdAt: string
}
