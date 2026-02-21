<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { useOrganizations } from '~/modules/organizations/composables/useOrganizations'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const { projects, loading, error, fetchAll, create } = useProjects()
const { organizations, fetchAll: fetchOrgs } = useOrganizations()
const toast = useToast()
const router = useRouter()

const showCreateDialog = ref(false)
const newProjectName = ref('')
const newProjectDescription = ref('')
const newProjectColor = ref('#6366f1')
const newProjectOrgId = ref('')

const colorPresets = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4']

const teamProjects = computed(() => projects.value.filter(p => p.organizationId))

onMounted(async () => {
  await Promise.all([fetchAll(), fetchOrgs()])
})

const handleCreate = async () => {
  if (!newProjectName.value.trim() || !newProjectOrgId.value) return

  const project = await create({
    name: newProjectName.value,
    description: newProjectDescription.value || undefined,
    color: newProjectColor.value,
    organizationId: newProjectOrgId.value,
  })

  if (project) {
    toast.success('Proyecto de equipo creado')
    showCreateDialog.value = false
    newProjectName.value = ''
    newProjectDescription.value = ''
    newProjectColor.value = '#6366f1'
    newProjectOrgId.value = ''
    await fetchAll()
  } else {
    toast.error('Error', error.value || 'No se pudo crear el proyecto')
  }
}

const goToProject = (slug: string) => {
  router.push(`/projects/${slug}`)
}

const goToBoard = (slug: string) => {
  router.push(`/projects/${slug}/board`)
}

const getOrgName = (orgId: string | null | undefined) => {
  if (!orgId) return 'Sin organizacion'
  const org = organizations.value.find(o => o.id === orgId)
  return org?.name || 'Organizacion'
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold tracking-tight flex items-center gap-2">
          Proyectos de Equipo
          <ModuleHelpButton module-name="projects" />
        </h1>
        <p class="text-xs text-muted-foreground">Proyectos de organizaciones con tablero Kanban</p>
      </div>
      <Button size="sm" @click="showCreateDialog = true">Nuevo Proyecto</Button>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-8 text-muted-foreground">Cargando...</div>

    <div v-else-if="teamProjects.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No tienes proyectos de equipo</p>
      <Button class="mt-4" @click="showCreateDialog = true">Crear proyecto de equipo</Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <Card
        v-for="project in teamProjects"
        :key="project.id"
        class="hover:shadow-md transition-shadow"
      >
        <CardContent class="p-4">
          <div class="flex items-center gap-2 cursor-pointer" @click="goToProject(project.slug)">
            <div v-if="project.color" class="w-3 h-3 rounded-full" :style="{ backgroundColor: project.color }" />
            <p class="text-sm font-semibold">{{ project.name }}</p>
            <span v-if="project.systemCode" class="text-[10px] text-muted-foreground font-mono">{{ project.systemCode }}</span>
          </div>
          <p v-if="project.description" class="text-xs text-muted-foreground mt-1 cursor-pointer" @click="goToProject(project.slug)">
            <span v-html="project.description" />
          </p>
          <div class="flex items-center gap-2 mt-2">
            <Badge variant="outline" class="text-[10px] px-1 py-0">{{ getOrgName(project.organizationId) }}</Badge>
            <Button size="sm" variant="secondary" class="h-6 text-xs" @click="goToBoard(project.slug)">
              Tablero
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Proyecto de Equipo</DialogTitle>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <div class="space-y-2">
            <Label for="project-name">Nombre</Label>
            <Input id="project-name" v-model="newProjectName" placeholder="Mi Proyecto" />
          </div>
          <div class="space-y-2">
            <Label>Descripcion (opcional)</Label>
            <RichTextEditor v-model="newProjectDescription" placeholder="Describe el proyecto..." :rows="6" />
          </div>
          <div class="space-y-2">
            <Label>Organizacion</Label>
            <Select v-model="newProjectOrgId">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar organizacion..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="org in organizations" :key="org.id" :value="org.id">
                  {{ org.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Color</Label>
            <div class="flex items-center gap-2">
              <div class="flex gap-1.5">
                <button
                  v-for="color in colorPresets"
                  :key="color"
                  type="button"
                  class="w-6 h-6 rounded-full border-2 transition-transform"
                  :class="newProjectColor === color ? 'border-foreground scale-110' : 'border-transparent'"
                  :style="{ backgroundColor: color }"
                  @click="newProjectColor = color"
                />
              </div>
              <input
                type="color"
                v-model="newProjectColor"
                class="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreateDialog = false">Cancelar</Button>
            <Button type="submit" :disabled="!newProjectName.trim() || !newProjectOrgId || loading">Crear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
