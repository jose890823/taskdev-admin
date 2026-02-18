export type TaskType = 'project' | 'daily'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

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
  createdById: string
  organizationId?: string | null
  priority: TaskPriority
  scheduledDate?: string | null
  dueDate?: string | null
  completedAt?: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  content: string
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
  organizationId?: string
  priority?: TaskPriority
  scheduledDate?: string
  dueDate?: string
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  statusId?: string
  assignedToId?: string
  priority?: TaskPriority
  scheduledDate?: string
  dueDate?: string
  position?: number
}

export interface CreateCommentDto {
  taskId: string
  content: string
}
