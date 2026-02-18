<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
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

const { tasks, loading, error, fetchMyTasks, create } = useTasks()
const toast = useToast()
const router = useRouter()

const showCreateDialog = ref(false)
const newTaskTitle = ref('')
const newTaskDescription = ref('')

onMounted(async () => {
  await fetchMyTasks()
})

const handleCreate = async () => {
  if (!newTaskTitle.value.trim()) return

  const task = await create({
    title: newTaskTitle.value,
    description: newTaskDescription.value || undefined,
  })

  if (task) {
    toast.success('Tarea creada exitosamente')
    showCreateDialog.value = false
    newTaskTitle.value = ''
    newTaskDescription.value = ''
  } else {
    toast.error('Error', error.value || 'No se pudo crear la tarea')
  }
}

const goToTask = (id: string) => {
  router.push(`/tasks/${id}`)
}

const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Tareas</h1>
        <p class="text-muted-foreground mt-1">Todas tus tareas</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="router.push('/tasks/daily')">Tareas Diarias</Button>
        <Button @click="showCreateDialog = true">Nueva Tarea</Button>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-12 text-muted-foreground">Cargando...</div>

    <div v-else-if="tasks.length === 0" class="text-center py-12">
      <p class="text-muted-foreground text-lg">No tienes tareas aun</p>
      <Button class="mt-4" @click="showCreateDialog = true">Crear tu primera tarea</Button>
    </div>

    <div v-else class="space-y-2">
      <Card
        v-for="task in tasks"
        :key="task.id"
        class="cursor-pointer hover:shadow-sm transition-shadow"
        @click="goToTask(task.id)"
      >
        <CardContent class="py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full" :class="task.completedAt ? 'bg-green-500' : 'bg-gray-300'" />
            <span :class="{ 'line-through text-muted-foreground': task.completedAt }">{{ task.title }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Badge v-if="task.priority" variant="outline" :class="priorityColor[task.priority]">
              {{ task.priority }}
            </Badge>
            <Badge v-if="task.type === 'daily'" variant="secondary">diaria</Badge>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <div class="space-y-2">
            <Label for="task-title">Titulo</Label>
            <Input id="task-title" v-model="newTaskTitle" placeholder="Titulo de la tarea" />
          </div>
          <div class="space-y-2">
            <Label for="task-desc">Descripcion (opcional)</Label>
            <Input id="task-desc" v-model="newTaskDescription" placeholder="Descripcion breve" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreateDialog = false">Cancelar</Button>
            <Button type="submit" :disabled="!newTaskTitle.trim() || loading">Crear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
