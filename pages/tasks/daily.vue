<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
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

const { tasks, loading, error, fetchDailyTasks, create } = useTasks()
const toast = useToast()

const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)

const showCreateDialog = ref(false)
const newTaskTitle = ref('')

onMounted(async () => {
  await fetchDailyTasks(selectedDate.value)
})

const changeDate = async (date: string) => {
  selectedDate.value = date
  await fetchDailyTasks(date)
}

const handleCreate = async () => {
  if (!newTaskTitle.value.trim()) return

  const task = await create({
    title: newTaskTitle.value,
    type: 'daily',
    scheduledDate: selectedDate.value,
  })

  if (task) {
    toast.success('Tarea diaria creada')
    showCreateDialog.value = false
    newTaskTitle.value = ''
    await fetchDailyTasks(selectedDate.value)
  } else {
    toast.error('Error', error.value || 'No se pudo crear la tarea')
  }
}

const completedCount = computed(() => tasks.value.filter(t => t.completedAt).length)
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Tareas Diarias</h1>
        <p class="text-muted-foreground mt-1">
          {{ completedCount }}/{{ tasks.length }} completadas
        </p>
      </div>
      <div class="flex gap-2 items-center">
        <Input type="date" :model-value="selectedDate" class="w-auto" @update:model-value="changeDate" />
        <Button @click="showCreateDialog = true">Nueva Tarea</Button>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-12 text-muted-foreground">Cargando...</div>

    <div v-else-if="tasks.length === 0" class="text-center py-12">
      <p class="text-muted-foreground text-lg">No hay tareas para este dia</p>
      <Button class="mt-4" @click="showCreateDialog = true">Agregar tarea</Button>
    </div>

    <div v-else class="space-y-2">
      <Card v-for="task in tasks" :key="task.id">
        <CardContent class="py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full" :class="task.completedAt ? 'bg-green-500' : 'bg-gray-300'" />
            <span :class="{ 'line-through text-muted-foreground': task.completedAt }">{{ task.title }}</span>
          </div>
          <Badge v-if="task.priority" variant="outline">{{ task.priority }}</Badge>
        </CardContent>
      </Card>
    </div>

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
          <DialogFooter>
            <Button type="button" variant="outline" @click="showCreateDialog = false">Cancelar</Button>
            <Button type="submit" :disabled="!newTaskTitle.trim() || loading">Crear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
