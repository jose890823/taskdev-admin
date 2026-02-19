export type TaskType = 'project' | 'daily'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskAssignee {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Task {
  id: string
  systemCode?: string
  type: TaskType
  title: string
  description?: string
  projectId?: string | null
  moduleId?: string | null
  parentId?: string | null
  statusId?: string | null
  assignedToId?: string | null
  assignedTo?: TaskAssignee | null
  assignees?: TaskAssignee[]
  createdById: string
  organizationId?: string | null
  priority: TaskPriority
  scheduledDate?: string | null
  dueDate?: string | null
  completedAt?: string | null
  position: number
  subtaskCount?: number
  commentCount?: number
  hasUnreadComments?: boolean
  createdAt: string
  updatedAt: string
}

export interface CommentAuthor {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  content: string
  author?: CommentAuthor | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDto {
  title: string
  description?: string
  type?: TaskType
  projectId?: string
  moduleId?: string
  statusId?: string
  assignedToId?: string
  assignedToIds?: string[]
  organizationId?: string
  priority?: TaskPriority
  scheduledDate?: string
  dueDate?: string
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  statusId?: string
  assignedToId?: string | null
  assignedToIds?: string[]
  priority?: TaskPriority
  scheduledDate?: string
  dueDate?: string
  position?: number
}

export interface CreateCommentDto {
  taskId: string
  content: string
}

export interface BulkPositionItem {
  id: string
  position: number
  statusId?: string
}

export interface KanbanColumn {
  status: import('~/modules/projects/types').TaskStatus
  tasks: Task[]
}
