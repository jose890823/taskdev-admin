export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Project {
  id: string
  systemCode?: string
  name: string
  slug: string
  description?: string
  color?: string
  ownerId: string
  organizationId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: ProjectRole
  createdAt: string
}

export interface ProjectModule {
  id: string
  projectId: string
  name: string
  description?: string
  color?: string
  position: number
  isActive: boolean
  createdAt: string
}

export interface TaskStatus {
  id: string
  projectId?: string | null
  name: string
  color: string
  icon?: string
  position: number
  isDefault: boolean
  isCompleted: boolean
}

export interface CreateProjectDto {
  name: string
  description?: string
  color?: string
  organizationId?: string
}

export interface UpdateProjectDto {
  name?: string
  description?: string
  color?: string
}
