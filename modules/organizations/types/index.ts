export type OrgRole = 'owner' | 'admin' | 'member'

export interface Organization {
  id: string
  systemCode?: string
  name: string
  slug: string
  description?: string
  logo?: string
  ownerId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    profilePhoto?: string
  }
  role: OrgRole
  createdAt: string
}

export interface Invitation {
  id: string
  organizationId: string
  email: string
  role: OrgRole
  token: string
  invitedById: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: string
  createdAt: string
}

export interface CreateOrganizationDto {
  name: string
  description?: string
}

export interface UpdateOrganizationDto {
  name?: string
  description?: string
}

export interface AddMemberDto {
  userId: string
  role: OrgRole
}

export interface CreateInvitationDto {
  email: string
  role: OrgRole
}
