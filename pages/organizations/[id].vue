<script setup lang="ts">
import { onMounted } from 'vue'
import { useOrganizations } from '~/modules/organizations/composables/useOrganizations'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const route = useRoute()
const orgId = route.params.id as string

const { currentOrg, members, invitations, loading, error, fetchById, fetchMembers, fetchInvitations } = useOrganizations()

onMounted(async () => {
  await Promise.all([
    fetchById(orgId),
    fetchMembers(orgId),
    fetchInvitations(orgId),
  ])
})
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <div v-if="loading" class="text-center py-12 text-muted-foreground">Cargando...</div>

    <template v-else-if="currentOrg">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{{ currentOrg.name }}</h1>
          <p class="text-muted-foreground mt-1">{{ currentOrg.description || currentOrg.slug }}</p>
        </div>
      </div>

      <Separator />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Miembros -->
        <Card>
          <CardHeader>
            <CardTitle>Miembros ({{ members.length }})</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="members.length === 0" class="text-muted-foreground text-sm">Sin miembros</div>
            <div v-else class="space-y-2">
              <div v-for="member in members" :key="member.id" class="flex items-center justify-between py-2">
                <span class="text-sm">{{ member.userId }}</span>
                <Badge variant="outline">{{ member.role }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Invitaciones -->
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones ({{ invitations.length }})</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="invitations.length === 0" class="text-muted-foreground text-sm">Sin invitaciones pendientes</div>
            <div v-else class="space-y-2">
              <div v-for="inv in invitations" :key="inv.id" class="flex items-center justify-between py-2">
                <div>
                  <span class="text-sm font-medium">{{ inv.email }}</span>
                  <Badge class="ml-2" :variant="inv.status === 'pending' ? 'default' : 'secondary'">{{ inv.status }}</Badge>
                </div>
                <Badge variant="outline">{{ inv.role }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
