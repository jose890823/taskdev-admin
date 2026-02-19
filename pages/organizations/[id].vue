<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrganizations } from '~/modules/organizations/composables/useOrganizations'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const route = useRoute()
const orgId = route.params.id as string
const toast = useToast()

const { currentOrg, members, invitations, loading, error, fetchById, fetchMembers, fetchInvitations, createInvitation, resendInvitation, cancelInvitation } = useOrganizations()
const { user } = useAuth()

// Role-based visibility: only owner/admin can manage invitations
const currentUserRole = computed(() => {
  if (!user.value) return null
  const member = members.value.find(m => m.userId === user.value!.id)
  return member?.role || null
})

const canManageInvitations = computed(() => {
  return currentUserRole.value === 'owner' || currentUserRole.value === 'admin'
})

// Formulario de invitacion
const inviteEmail = ref('')
const inviteRole = ref<'member' | 'admin'>('member')
const inviting = ref(false)

// Traducciones
const roleLabels: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  member: 'Miembro',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  expired: 'Expirada',
  cancelled: 'Cancelada',
}

// Filtrar invitaciones
const pendingInvitations = computed(() => invitations.value.filter(i => i.status === 'pending'))
const otherInvitations = computed(() => invitations.value.filter(i => i.status !== 'pending'))

onMounted(async () => {
  await Promise.all([
    fetchById(orgId),
    fetchMembers(orgId),
    fetchInvitations(orgId),
  ])
})

const handleInvite = async () => {
  if (!inviteEmail.value.trim()) return

  inviting.value = true
  try {
    await createInvitation(orgId, {
      email: inviteEmail.value.trim(),
      role: inviteRole.value,
    })
    toast.success('Invitacion enviada', `Se envio una invitacion a ${inviteEmail.value}`)
    inviteEmail.value = ''
    inviteRole.value = 'member'
  } catch (e: any) {
    toast.error('Error', error.value || 'No se pudo enviar la invitacion')
  } finally {
    inviting.value = false
  }
}

const resendingId = ref<string | null>(null)

const handleResend = async (invitationId: string) => {
  resendingId.value = invitationId
  try {
    await resendInvitation(invitationId)
    toast.success('Invitacion reenviada', 'Se reenvio el email de invitacion')
  } catch {
    toast.error('Error', error.value || 'No se pudo reenviar la invitacion')
  } finally {
    resendingId.value = null
  }
}

const handleCancel = async (invitationId: string) => {
  try {
    await cancelInvitation(invitationId, orgId)
    toast.success('Invitacion cancelada')
  } catch {
    toast.error('Error', error.value || 'No se pudo cancelar la invitacion')
  }
}

// Helper para obtener iniciales del miembro
const getMemberInitials = (member: any): string => {
  if (member.user?.firstName && member.user?.lastName) {
    return (member.user.firstName[0] + member.user.lastName[0]).toUpperCase()
  }
  return member.userId.slice(0, 2).toUpperCase()
}

const getMemberName = (member: any): string => {
  if (member.user?.firstName) {
    return `${member.user.firstName} ${member.user.lastName || ''}`.trim()
  }
  return member.userId.slice(0, 12) + '...'
}

const getMemberEmail = (member: any): string | null => {
  return member.user?.email || null
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="loading" class="text-center py-8 text-muted-foreground">Cargando...</div>

    <template v-else-if="currentOrg">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" class="h-7 w-7 p-0 text-muted-foreground" @click="navigateTo('/organizations')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Button>
        <div>
          <h1 class="text-lg font-semibold tracking-tight leading-tight">{{ currentOrg.name }}</h1>
          <p v-if="currentOrg.description" class="text-xs text-muted-foreground" v-html="currentOrg.description" />
          <p v-else class="text-xs text-muted-foreground">{{ currentOrg.slug }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- Miembros -->
        <Card>
          <CardContent class="p-4 space-y-2">
            <div>
              <p class="text-sm font-semibold">Miembros ({{ members.length }})</p>
              <p class="text-[11px] text-muted-foreground">Usuarios que pertenecen a esta organizacion</p>
            </div>
            <div v-if="members.length === 0" class="text-muted-foreground text-xs">Sin miembros</div>
            <div v-else class="space-y-0.5">
              <div v-for="member in members" :key="member.id" class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                    {{ getMemberInitials(member) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium leading-tight">{{ getMemberName(member) }}</p>
                    <p v-if="getMemberEmail(member)" class="text-[11px] text-muted-foreground">{{ getMemberEmail(member) }}</p>
                  </div>
                </div>
                <Badge variant="outline" class="text-xs">{{ roleLabels[member.role] || member.role }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Invitar + Invitaciones (solo owner/admin) -->
        <div v-if="canManageInvitations" class="space-y-3">
          <!-- Formulario de invitacion inline -->
          <Card>
            <CardContent class="p-4 space-y-2">
              <p class="text-sm font-semibold">Invitar Usuario</p>
              <form class="flex items-center gap-2" @submit.prevent="handleInvite">
                <Input
                  id="invite-email"
                  v-model="inviteEmail"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  :disabled="inviting"
                  class="flex-1 h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  class="h-8"
                  :variant="inviteRole === 'member' ? 'default' : 'outline'"
                  @click="inviteRole = 'member'"
                >
                  Miembro
                </Button>
                <Button
                  type="button"
                  size="sm"
                  class="h-8"
                  :variant="inviteRole === 'admin' ? 'default' : 'outline'"
                  @click="inviteRole = 'admin'"
                >
                  Admin
                </Button>
                <Button type="submit" :disabled="inviting || !inviteEmail" size="sm" class="h-8">
                  {{ inviting ? 'Enviando...' : 'Invitar' }}
                </Button>
              </form>
              <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
            </CardContent>
          </Card>

          <!-- Invitaciones pendientes -->
          <Card v-if="pendingInvitations.length > 0">
            <CardContent class="p-4 space-y-2">
              <p class="text-sm font-semibold">Pendientes ({{ pendingInvitations.length }})</p>
              <div class="space-y-0.5">
                <div v-for="inv in pendingInvitations" :key="inv.id" class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-medium">{{ inv.email }}</span>
                    <Badge variant="outline" class="text-[10px] px-1 py-0">{{ roleLabels[inv.role] || inv.role }}</Badge>
                    <Badge variant="default" class="text-[10px] px-1 py-0">{{ statusLabels[inv.status] || inv.status }}</Badge>
                  </div>
                  <div class="flex items-center gap-1">
                    <Button size="sm" variant="outline" class="h-6 text-xs" :disabled="resendingId === inv.id" @click="handleResend(inv.id)">Reenviar</Button>
                    <Button size="sm" variant="destructive" class="h-6 text-xs" @click="handleCancel(inv.id)">Cancelar</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Historial de invitaciones -->
          <Card v-if="otherInvitations.length > 0">
            <CardContent class="p-4 space-y-2">
              <p class="text-sm font-semibold">Historial ({{ otherInvitations.length }})</p>
              <div class="space-y-0">
                <div v-for="inv in otherInvitations" :key="inv.id" class="flex items-center justify-between py-1 text-muted-foreground border-b border-border/30 last:border-0">
                  <span class="text-xs">{{ inv.email }}</span>
                  <div class="flex items-center gap-1">
                    <Badge variant="outline" class="text-[10px] px-1 py-0">{{ roleLabels[inv.role] || inv.role }}</Badge>
                    <Badge class="text-[10px] px-1 py-0" :variant="inv.status === 'accepted' ? 'default' : 'secondary'">{{ statusLabels[inv.status] || inv.status }}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
