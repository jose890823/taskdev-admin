<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '~/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import DataTable from '~/components/shared/DataTable/DataTable.vue'
import type { ColumnDef } from '~/components/shared/DataTable/types'
import type { Task } from '~/modules/tasks/types'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const { tasks, loading, error, fetchMyTasks, fetchAll: fetchAllTasks, create, remove } = useTasks()
const { projects, projectModules, fetchAll: fetchProjects, fetchModules } = useProjects()
const toast = useToast()
const router = useRouter()
const route = useRoute()

// ── Filters ──
const filterType = ref('all') // 'all' | 'daily' | 'project'
const filterProjectId = ref('all') // 'all' | projectId

const applyFilters = async () => {
  if (filterType.value === 'daily') {
    await fetchMyTasks('daily')
  } else if (filterProjectId.value !== 'all') {
    await fetchAllTasks({
      projectId: filterProjectId.value,
      type: filterType.value === 'project' ? 'project' : undefined,
    })
  } else if (filterType.value === 'project') {
    await fetchMyTasks('project')
  } else {
    await fetchMyTasks()
  }
}

watch(filterType, async (val) => {
  if (val === 'daily') filterProjectId.value = 'all'
  await applyFilters()
})

watch(filterProjectId, async (val) => {
  if (val !== 'all') filterType.value = 'all'
  await applyFilters()
})

const clearFilters = () => {
  filterType.value = 'all'
  filterProjectId.value = 'all'
}

const hasActiveFilters = computed(() => filterType.value !== 'all' || filterProjectId.value !== 'all')

// ── Local search (replaces DataTable searchable) ──
const searchTerm = ref('')
const filteredTasks = computed(() => {
  if (!searchTerm.value) return tasks.value
  const term = searchTerm.value.toLowerCase()
  return tasks.value.filter(t => t.title.toLowerCase().includes(term))
})

const showCreateDialog = ref(false)
const newTaskTitle = ref('')
const newTaskDescription = ref('')
const newTaskProjectId = ref('none')
const newTaskModuleId = ref('none')
const newTaskPriority = ref<string>('medium')
const newTaskDueDate = ref('')

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

const priorityLabel: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

// ── Table columns ──
const columns: ColumnDef<Task>[] = [
  { key: 'status', label: '', width: '40px', sortable: false, searchable: false },
  { key: 'title', label: 'Titulo', sortable: true, searchable: true },
  { key: 'priority', label: 'Prioridad', sortable: true, width: '120px', align: 'center' },
  { key: 'type', label: 'Tipo', sortable: true, width: '100px', align: 'center' },
  {
    key: 'dueDate',
    label: 'Fecha limite',
    sortable: true,
    width: '140px',
    align: 'center',
    format: (value: string | null) => {
      if (!value) return '-'
      return new Date(value).toLocaleDateString('es', { day: '2-digit', month: 'short' })
    },
  },
  { key: 'createdAt', label: 'Creada', sortable: true, width: '140px', align: 'center',
    format: (value: string) => new Date(value).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
  },
  { key: 'actions', label: '', width: '60px', sortable: false, searchable: false, align: 'center' },
]

const handleRowClick = (row: Task) => {
  router.push(`/tasks/${row.id}`)
}

const handleDelete = async (task: Task) => {
  await remove(task.id)
  toast.success('Tarea eliminada')
}

// Load modules when project changes
watch(newTaskProjectId, async (projectId) => {
  newTaskModuleId.value = 'none'
  if (projectId && projectId !== 'none') {
    await fetchModules(projectId)
  }
})

onMounted(async () => {
  await fetchProjects()
  const qProjectId = route.query.projectId as string | undefined
  if (qProjectId) {
    filterProjectId.value = qProjectId
    // applyFilters se ejecuta via el watcher
  } else {
    await fetchMyTasks()
  }
})

const handleCreate = async () => {
  if (!newTaskTitle.value.trim()) return

  const task = await create({
    title: newTaskTitle.value,
    description: newTaskDescription.value || undefined,
    projectId: newTaskProjectId.value === 'none' ? undefined : newTaskProjectId.value,
    moduleId: newTaskModuleId.value === 'none' ? undefined : newTaskModuleId.value,
    priority: newTaskPriority.value as any,
    dueDate: newTaskDueDate.value || undefined,
  })

  if (task) {
    toast.success('Tarea creada exitosamente')
    showCreateDialog.value = false
    newTaskTitle.value = ''
    newTaskDescription.value = ''
    newTaskProjectId.value = 'none'
    newTaskModuleId.value = 'none'
    newTaskPriority.value = 'medium'
    newTaskDueDate.value = ''
  } else {
    toast.error('Error', error.value || 'No se pudo crear la tarea')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold tracking-tight">Tareas</h1>
        <p class="text-xs text-muted-foreground">Todas tus tareas</p>
      </div>
      <div class="flex gap-2">
        <Button size="sm" variant="outline" @click="router.push('/tasks/daily')">Tareas Diarias</Button>
        <Button size="sm" @click="showCreateDialog = true">Nueva Tarea</Button>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <!-- Filters + Search inline -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <Input v-model="searchTerm" placeholder="Buscar tareas..." class="pl-9 h-8" />
      </div>

      <div class="w-px h-6 bg-border" />

      <div class="flex gap-1.5">
        <Button
          size="sm"
          :variant="filterType === 'all' && filterProjectId === 'all' ? 'default' : 'outline'"
          @click="clearFilters"
        >
          Todas
        </Button>
        <Button
          size="sm"
          :variant="filterType === 'daily' ? 'default' : 'outline'"
          @click="filterType = filterType === 'daily' ? 'all' : 'daily'"
        >
          Diarias
        </Button>
        <Button
          size="sm"
          :variant="filterType === 'project' && filterProjectId === 'all' ? 'default' : 'outline'"
          @click="filterType = filterType === 'project' ? 'all' : 'project'"
        >
          De proyecto
        </Button>
      </div>

      <div class="w-px h-6 bg-border" />

      <Select v-model="filterProjectId">
        <SelectTrigger class="w-[200px] h-8 text-sm">
          <SelectValue placeholder="Filtrar por proyecto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los proyectos</SelectItem>
          <SelectItem v-for="p in projects" :key="p.id" :value="p.id">
            <div class="flex items-center gap-2">
              <div v-if="p.color" class="w-2 h-2 rounded-full" :style="{ backgroundColor: p.color }" />
              {{ p.name }}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button v-if="hasActiveFilters" size="sm" variant="ghost" class="text-muted-foreground" @click="clearFilters">
        Limpiar
      </Button>
    </div>

    <DataTable
      :data="filteredTasks"
      :columns="columns"
      :loading="loading"
      :searchable="false"
      empty-message="No tienes tareas aun"
      row-key="id"
      :row-clickable="true"
      @row-click="handleRowClick"
    >
      <!-- Status dot -->
      <template #cell-status="{ row }">
        <div class="flex justify-center">
          <div class="w-2.5 h-2.5 rounded-full" :class="row.completedAt ? 'bg-green-500' : 'bg-gray-400'" />
        </div>
      </template>

      <!-- Title with strikethrough if completed -->
      <template #cell-title="{ row }">
        <div class="flex items-center gap-1.5">
          <span :class="{ 'line-through text-muted-foreground': row.completedAt }">
            {{ row.title }}
          </span>
          <span v-if="row.systemCode" class="text-[10px] text-muted-foreground font-mono shrink-0">{{ row.systemCode }}</span>
        </div>
      </template>

      <!-- Priority badge -->
      <template #cell-priority="{ row }">
        <Badge v-if="row.priority" variant="outline" :class="priorityColor[row.priority]">
          {{ priorityLabel[row.priority] || row.priority }}
        </Badge>
      </template>

      <!-- Type badge -->
      <template #cell-type="{ row }">
        <Badge :variant="row.type === 'daily' ? 'secondary' : 'outline'">
          {{ row.type === 'daily' ? 'Diaria' : 'Proyecto' }}
        </Badge>
      </template>

      <!-- Actions -->
      <template #cell-actions="{ row }">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button
              size="sm"
              variant="ghost"
              class="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              @click.stop
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent @click.stop>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
              <AlertDialogDescription>
                Estas seguro de eliminar "{{ row.title }}"? Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction @click="handleDelete(row)">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
    </DataTable>

    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <div class="space-y-2">
            <Label for="task-title">Titulo</Label>
            <Input id="task-title" v-model="newTaskTitle" placeholder="Titulo de la tarea" />
          </div>
          <div class="space-y-2">
            <Label>Descripcion (opcional)</Label>
            <RichTextEditor v-model="newTaskDescription" placeholder="Describe la tarea en detalle..." :rows="8" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Proyecto (opcional)</Label>
              <Select v-model="newTaskProjectId">
                <SelectTrigger>
                  <SelectValue placeholder="Sin proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  <SelectItem v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>Modulo (opcional)</Label>
              <Select v-model="newTaskModuleId" :disabled="newTaskProjectId === 'none'">
                <SelectTrigger>
                  <SelectValue placeholder="Sin modulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin modulo</SelectItem>
                  <SelectItem v-for="m in projectModules" :key="m.id" :value="m.id">{{ m.name }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          <div class="space-y-2">
            <Label for="task-due">Fecha limite (opcional)</Label>
            <Input id="task-due" v-model="newTaskDueDate" type="date" class="w-auto" />
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
