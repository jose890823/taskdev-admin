<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProjects } from '~/modules/projects/composables/useProjects'
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

const { projects, loading, error, fetchAll, create } = useProjects()
const toast = useToast()
const router = useRouter()

const showCreateDialog = ref(false)
const newProjectName = ref('')
const newProjectDescription = ref('')

onMounted(async () => {
  await fetchAll()
})

const handleCreate = async () => {
  if (!newProjectName.value.trim()) return

  const project = await create({
    name: newProjectName.value,
    description: newProjectDescription.value || undefined,
  })

  if (project) {
    toast.success('Proyecto creado exitosamente')
    showCreateDialog.value = false
    newProjectName.value = ''
    newProjectDescription.value = ''
  } else {
    toast.error('Error', error.value || 'No se pudo crear el proyecto')
  }
}

const goToProject = (slug: string) => {
  router.push(`/projects/${slug}`)
}
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Proyectos</h1>
        <p class="text-muted-foreground mt-1">Gestiona tus proyectos y tareas</p>
      </div>
      <Button @click="showCreateDialog = true">Nuevo Proyecto</Button>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-12 text-muted-foreground">Cargando...</div>

    <div v-else-if="projects.length === 0" class="text-center py-12">
      <p class="text-muted-foreground text-lg">No tienes proyectos aun</p>
      <Button class="mt-4" @click="showCreateDialog = true">Crear tu primer proyecto</Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="project in projects"
        :key="project.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="goToProject(project.slug)"
      >
        <CardHeader>
          <div class="flex items-center gap-2">
            <div v-if="project.color" class="w-3 h-3 rounded-full" :style="{ backgroundColor: project.color }" />
            <CardTitle>{{ project.name }}</CardTitle>
          </div>
          <CardDescription v-if="project.description">{{ project.description }}</CardDescription>
        </CardHeader>
      </Card>
    </div>

    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Proyecto</DialogTitle>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <div class="space-y-2">
            <Label for="project-name">Nombre</Label>
            <Input id="project-name" v-model="newProjectName" placeholder="Mi Proyecto" />
          </div>
          <div class="space-y-2">
            <Label for="project-desc">Descripcion (opcional)</Label>
            <Input id="project-desc" v-model="newProjectDescription" placeholder="Descripcion breve" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreateDialog = false">Cancelar</Button>
            <Button type="submit" :disabled="!newProjectName.trim() || loading">Crear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
