<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '~/components/ui/dialog'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const { tasks, loading, error, fetchDailyTasks, create, update } = useTasks()
const { globalStatuses, fetchGlobalStatuses } = useProjects()
const toast = useToast()

const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)

const showCreateDialog = ref(false)
const newTaskTitle = ref('')
const newTaskPriority = ref<string>('medium')

const priorities = [
  { value: 'low', label: 'Baja', class: 'bg-gray-500 text-white hover:bg-gray-600' },
  { value: 'medium', label: 'Media', class: 'bg-blue-500 text-white hover:bg-blue-600' },
  { value: 'high', label: 'Alta', class: 'bg-orange-500 text-white hover:bg-orange-600' },
  { value: 'urgent', label: 'Urgente', class: 'bg-red-500 text-white hover:bg-red-600' },
]

const priorityColor: Record<string, string> = {
  low: 'bg-gray-500 text-white border-gray-500',
  medium: 'bg-blue-500 text-white border-blue-500',
  high: 'bg-orange-500 text-white border-orange-500',
  urgent: 'bg-red-500 text-white border-red-500',
}

// Find the "Completado" status from global statuses
const completedStatus = computed(() => globalStatuses.value.find(s => s.isCompleted))
const defaultStatus = computed(() => globalStatuses.value.find(s => s.isDefault))

onMounted(async () => {
  await Promise.all([
    fetchDailyTasks(selectedDate.value),
    fetchGlobalStatuses(),
  ])
})

const changeDate = async (date: string) => {
  selectedDate.value = date
  await fetchDailyTasks(date)
}

const toggleComplete = async (task: any) => {
  const isCompleted = !!task.completedAt
  if (isCompleted) {
    // Uncomplete: set back to default status
    if (defaultStatus.value) {
      await update(task.id, { statusId: defaultStatus.value.id })
    }
  } else {
    // Complete: set to completed status
    if (completedStatus.value) {
      await update(task.id, { statusId: completedStatus.value.id })
    }
  }
  await fetchDailyTasks(selectedDate.value)
}

const handleCreate = async () => {
  if (!newTaskTitle.value.trim()) return

  const task = await create({
    title: newTaskTitle.value,
    type: 'daily',
    scheduledDate: selectedDate.value,
    priority: newTaskPriority.value as any,
  })

  if (task) {
    toast.success('Tarea diaria creada')
    showCreateDialog.value = false
    newTaskTitle.value = ''
    newTaskPriority.value = 'medium'
    await fetchDailyTasks(selectedDate.value)
  } else {
    toast.error('Error', error.value || 'No se pudo crear la tarea')
  }
}

const completedCount = computed(() => tasks.value.filter(t => t.completedAt).length)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold tracking-tight">Tareas Diarias</h1>
        <p class="text-xs text-muted-foreground">
          {{ completedCount }}/{{ tasks.length }} completadas
        </p>
      </div>
      <div class="flex gap-2 items-center">
        <Input type="date" :model-value="selectedDate" class="w-auto h-8 text-sm" @update:model-value="changeDate" />
        <Button size="sm" @click="showCreateDialog = true">Nueva Tarea</Button>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-8 text-muted-foreground">Cargando...</div>

    <div v-else-if="tasks.length === 0" class="text-center py-8">
      <p class="text-muted-foreground">No hay tareas para este dia</p>
      <Button class="mt-4" @click="showCreateDialog = true">Agregar tarea</Button>
    </div>

    <Card v-else>
      <CardContent class="p-4 space-y-0">
        <div v-for="task in tasks" :key="task.id" class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
          <div class="flex items-center gap-2">
            <Checkbox
              :checked="!!task.completedAt"
              @update:checked="toggleComplete(task)"
            />
            <NuxtLink
              :to="`/tasks/${task.id}`"
              class="text-sm hover:underline"
              :class="{ 'line-through text-muted-foreground': task.completedAt }"
            >
              {{ task.title }}
            </NuxtLink>
          </div>
          <Badge v-if="task.priority" variant="outline" class="text-[10px] px-1 py-0" :class="priorityColor[task.priority]">
            {{ priorities.find(p => p.value === task.priority)?.label || task.priority }}
          </Badge>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="showCreateDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Tarea Diaria</DialogTitle>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <div class="space-y-2">
            <Label for="daily-title">Titulo</Label>
            <Input id="daily-title" v-model="newTaskTitle" placeholder="Que necesitas hacer hoy?" />
          </div>
          <div class="space-y-2">
            <Label>Prioridad</Label>
            <div class="flex gap-2">
              <Button
                v-for="p in priorities"
                :key="p.value"
                type="button"
                size="sm"
                :variant="newTaskPriority === p.value ? 'default' : 'outline'"
                :class="newTaskPriority === p.value ? p.class : ''"
                @click="newTaskPriority = p.value"
              >
                {{ p.label }}
              </Button>
            </div>
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
