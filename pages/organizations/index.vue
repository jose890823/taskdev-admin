<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOrganizations } from '~/modules/organizations/composables/useOrganizations'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
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
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold tracking-tight">Organizaciones</h1>
        <p class="text-xs text-muted-foreground">Gestiona tus organizaciones y equipos</p>
      </div>
      <Button size="sm" @click="showCreateDialog = true">Nueva Organizacion</Button>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-8 text-muted-foreground">
      Cargando...
    </div>

    <div v-else-if="organizations.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No tienes organizaciones aun</p>
      <Button class="mt-4" @click="showCreateDialog = true">Crear tu primera organizacion</Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <Card
        v-for="org in organizations"
        :key="org.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="goToOrg(org.id)"
      >
        <CardContent class="p-4">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold">{{ org.name }}</p>
            <span v-if="org.systemCode" class="text-[10px] text-muted-foreground font-mono">{{ org.systemCode }}</span>
          </div>
          <p v-if="org.description" class="text-xs text-muted-foreground mt-1" v-html="org.description" />
          <p v-else class="text-xs text-muted-foreground mt-1">{{ org.slug }}</p>
        </CardContent>
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
            <Label>Descripcion (opcional)</Label>
            <RichTextEditor v-model="newOrgDescription" placeholder="Describe la organizacion..." :rows="6" />
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
