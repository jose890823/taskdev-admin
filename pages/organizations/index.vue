<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOrganizations } from '~/modules/organizations/composables/useOrganizations'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const { organizations, loading, error, fetchAll, create } = useOrganizations()
const toast = useToast()
const router = useRouter()

const showCreateDialog = ref(false)
const newOrgName = ref('')
const newOrgDescription = ref('')

onMounted(async () => {
  await fetchAll()
})

const handleCreate = async () => {
  if (!newOrgName.value.trim()) return

  const org = await create({
    name: newOrgName.value,
    description: newOrgDescription.value || undefined,
  })

  if (org) {
    toast.success('Organizacion creada exitosamente')
    showCreateDialog.value = false
    newOrgName.value = ''
    newOrgDescription.value = ''
  } else {
    toast.error('Error', error.value || 'No se pudo crear la organizacion')
  }
}

const goToOrg = (id: string) => {
  router.push(`/organizations/${id}`)
}
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Organizaciones</h1>
        <p class="text-muted-foreground mt-1">Gestiona tus organizaciones y equipos</p>
      </div>
      <Button @click="showCreateDialog = true">Nueva Organizacion</Button>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-12 text-muted-foreground">
      Cargando...
    </div>

    <div v-else-if="organizations.length === 0" class="text-center py-12">
      <p class="text-muted-foreground text-lg">No tienes organizaciones aun</p>
      <Button class="mt-4" @click="showCreateDialog = true">Crear tu primera organizacion</Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="org in organizations"
        :key="org.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="goToOrg(org.id)"
      >
        <CardHeader>
          <CardTitle>{{ org.name }}</CardTitle>
          <CardDescription v-if="org.description">{{ org.description }}</CardDescription>
          <CardDescription v-else class="text-xs">{{ org.slug }}</CardDescription>
        </CardHeader>
      </Card>
    </div>

    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Organizacion</DialogTitle>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <div class="space-y-2">
            <Label for="org-name">Nombre</Label>
            <Input id="org-name" v-model="newOrgName" placeholder="Mi Organizacion" />
          </div>
          <div class="space-y-2">
            <Label for="org-desc">Descripcion (opcional)</Label>
            <Input id="org-desc" v-model="newOrgDescription" placeholder="Descripcion breve" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreateDialog = false">Cancelar</Button>
            <Button type="submit" :disabled="!newOrgName.trim() || loading">Crear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
