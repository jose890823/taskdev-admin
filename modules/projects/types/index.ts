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
  parentId?: string | null
  parent?: Project | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    profilePhoto?: string
  }
  role: ProjectRole
  createdAt: string
}

export interface ProjectModule {
  id: string
  projectId: string
  parentId?: string | null
  name: string
  description?: string
  color?: string
  position: number
  isActive: boolean
  createdAt: string
  children?: ProjectModule[]
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
  parentId?: string
}

export interface UpdateProjectDto {
  name?: string
  description?: string
  color?: string
}

export interface CreateModuleDto {
  name: string
  description?: string
  color?: string
  parentId?: string
}

export interface CreateStatusDto {
  name: string
  color?: string
  icon?: string
  isDefault?: boolean
  isCompleted?: boolean
}

export interface AddProjectMemberDto {
  userId: string
  role: ProjectRole
}

export interface InviteProjectMemberDto {
  email: string
  role?: ProjectRole
}

export interface ProjectInvitation {
  id: string
  email: string
  projectRole: string | null
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  createdAt: string
}
