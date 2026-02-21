<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { useAuth } from '~/modules/auth/composables/useAuth'
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
import type { ProjectModule } from '~/modules/projects/types'
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
const newTaskPriority = ref<string>('medium')
const newTaskDueDate = ref('')

// ── Explorer state ──
const selectedProjectId = ref<string | null>(null)
const selectedModuleIds = ref<string[]>([])

const findModuleInTree = (modules: ProjectModule[], id: string): ProjectModule | null => {
  for (const m of modules) {
    if (m.id === id) return m
    if (m.children?.length) {
      const found = findModuleInTree(m.children, id)
      if (found) return found
    }
  }
  return null
}

const rootModules = computed(() => projectModules.value)

const level1Children = computed(() => {
  if (!selectedModuleIds.value[0]) return []
  const root = findModuleInTree(projectModules.value, selectedModuleIds.value[0])
  return root?.children || []
})

const level2Children = computed(() => {
  if (!selectedModuleIds.value[1]) return []
  const parent = findModuleInTree(projectModules.value, selectedModuleIds.value[1])
  return parent?.children || []
})

const selectProject = async (projectId: string | null) => {
  selectedProjectId.value = projectId
  selectedModuleIds.value = []
  if (projectId) {
    await fetchModules(projectId)
  }
}

const selectModule = (moduleId: string, level: number) => {
  const newIds = selectedModuleIds.value.slice(0, level)
  newIds[level] = moduleId
  selectedModuleIds.value = newIds
}

const selectionBreadcrumb = computed(() => {
  const parts: string[] = []
  if (selectedProjectId.value) {
    const proj = projects.value.find(p => p.id === selectedProjectId.value)
    if (proj) parts.push(proj.name)
  }
  for (const moduleId of selectedModuleIds.value) {
    const mod = findModuleInTree(projectModules.value, moduleId)
    if (mod) parts.push(mod.name)
  }
  return parts
})

const clearExplorerSelection = () => {
  selectedProjectId.value = null
  selectedModuleIds.value = []
}

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

// ── Module tree cache for breadcrumbs ──
const { accessToken } = useAuth()
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl as string
const moduleTreeCache = reactive<Record<string, ProjectModule[]>>({})

const loadModuleTrees = async () => {
  const projectIds = [...new Set(
    tasks.value.filter(t => t.moduleId && t.projectId).map(t => t.projectId!),
  )]
  const toFetch = projectIds.filter(pid => !moduleTreeCache[pid])
  if (!toFetch.length) return

  await Promise.all(toFetch.map(async (pid) => {
    try {
      const res = await $fetch<{ success: boolean; data: ProjectModule[] }>(`${apiUrl}/projects/${pid}/modules`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })
      moduleTreeCache[pid] = res.data
    } catch {
      moduleTreeCache[pid] = []
    }
  }))
}

watch(tasks, () => loadModuleTrees())

const buildModulePath = (modules: ProjectModule[], targetId: string, path: string[]): string[] | null => {
  for (const m of modules) {
    if (m.id === targetId) return [...path, m.name]
    if (m.children?.length) {
      const found = buildModulePath(m.children, targetId, [...path, m.name])
      if (found) return found
    }
  }
  return null
}

const getModuleBreadcrumb = (task: Task): string[] => {
  if (!task.moduleId || !task.projectId) return []
  const tree = moduleTreeCache[task.projectId]
  if (!tree) return []
  return buildModulePath(tree, task.moduleId, []) || []
}

// ── Table columns ──
const columns: ColumnDef<Task>[] = [
  { key: 'status', label: '', width: '40px', sortable: false, searchable: false },
  { key: 'title', label: 'Titulo', sortable: true, searchable: true },
  { key: 'systemCode', label: 'Codigo', sortable: true, width: '200px', searchable: true },
  { key: 'module', label: 'Modulo', sortable: false, searchable: false, width: '200px' },
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

const copyCode = (code: string) => {
  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
    } else {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    toast.success('Codigo copiado')
  } catch {
    toast.error('No se pudo copiar')
  }
}

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

  const lastModuleId = selectedModuleIds.value.length
    ? selectedModuleIds.value[selectedModuleIds.value.length - 1]
    : undefined

  const task = await create({
    title: newTaskTitle.value,
    description: newTaskDescription.value || undefined,
    projectId: selectedProjectId.value || undefined,
    moduleId: lastModuleId,
    priority: newTaskPriority.value as any,
    dueDate: newTaskDueDate.value || undefined,
  })

  if (task) {
    toast.success('Tarea creada exitosamente')
    showCreateDialog.value = false
    newTaskTitle.value = ''
    newTaskDescription.value = ''
    selectedProjectId.value = null
    selectedModuleIds.value = []
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
        <h1 class="text-lg font-semibold tracking-tight flex items-center gap-2">
          Tareas
          <ModuleHelpButton module-name="tasks" />
        </h1>
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

      <!-- System code with copy -->
      <template #cell-systemCode="{ row }">
        <div v-if="row.systemCode" class="flex items-center gap-1">
          <span class="text-xs text-muted-foreground font-mono">{{ row.systemCode }}</span>
          <button
            type="button"
            class="invisible group-hover/row:visible p-0.5 rounded hover:bg-muted"
            @click.stop.prevent="copyCode(row.systemCode)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <span v-else class="text-xs text-muted-foreground">-</span>
      </template>

      <!-- Title with strikethrough if completed -->
      <template #cell-title="{ row }">
        <span :class="{ 'line-through text-muted-foreground': row.completedAt }">
          {{ row.title }}
        </span>
      </template>

      <!-- Module breadcrumb -->
      <template #cell-module="{ row }">
        <div v-if="getModuleBreadcrumb(row).length" class="flex items-center gap-0.5 text-xs text-muted-foreground truncate">
          <span v-for="(part, i) in getModuleBreadcrumb(row)" :key="i" class="flex items-center gap-0.5 min-w-0">
            <svg v-if="i > 0" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 opacity-40"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate" :class="i === getModuleBreadcrumb(row).length - 1 ? 'text-foreground' : ''">{{ part }}</span>
          </span>
        </div>
        <span v-else class="text-xs text-muted-foreground">-</span>
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
          <!-- Explorer de columnas: Proyecto / Modulo -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label>Proyecto / Modulo (opcional)</Label>
              <button
                v-if="selectedProjectId"
                type="button"
                class="text-xs text-muted-foreground hover:text-foreground transition-colors"
                @click="clearExplorerSelection"
              >
                Limpiar seleccion
              </button>
            </div>
            <div class="border rounded-lg overflow-hidden">
              <div class="flex overflow-x-auto" style="height: 200px;">
                <!-- Columna: Proyectos -->
                <div class="min-w-[170px] max-w-[170px] border-r flex flex-col">
                  <div class="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b shrink-0">
                    Proyectos
                  </div>
                  <div class="overflow-y-auto flex-1">
                    <button
                      v-for="p in projects"
                      :key="p.id"
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                      :class="selectedProjectId === p.id ? 'bg-accent text-accent-foreground font-medium' : ''"
                      @click="selectProject(p.id)"
                    >
                      <div v-if="p.color" class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: p.color }" />
                      <span class="truncate flex-1">{{ p.name }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                    <div v-if="!projects.length" class="px-3 py-4 text-xs text-muted-foreground text-center">
                      Sin proyectos
                    </div>
                  </div>
                </div>

                <!-- Columna: Modulos raiz -->
                <div v-if="selectedProjectId" class="min-w-[170px] max-w-[170px] border-r flex flex-col">
                  <div class="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b shrink-0">
                    Modulos
                  </div>
                  <div class="overflow-y-auto flex-1">
                    <button
                      v-for="m in rootModules"
                      :key="m.id"
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                      :class="selectedModuleIds[0] === m.id ? 'bg-accent text-accent-foreground font-medium' : ''"
                      @click="selectModule(m.id, 0)"
                    >
                      <div v-if="m.color" class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: m.color }" />
                      <span class="truncate flex-1">{{ m.name }}</span>
                      <svg v-if="m.children?.length" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                    <div v-if="!rootModules.length" class="px-3 py-4 text-xs text-muted-foreground text-center">
                      Sin modulos
                    </div>
                  </div>
                </div>

                <!-- Columna: Sub-nivel 1 -->
                <div v-if="level1Children.length" class="min-w-[170px] max-w-[170px] border-r flex flex-col">
                  <div class="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b shrink-0 truncate">
                    {{ findModuleInTree(projectModules, selectedModuleIds[0])?.name }}
                  </div>
                  <div class="overflow-y-auto flex-1">
                    <button
                      v-for="m in level1Children"
                      :key="m.id"
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                      :class="selectedModuleIds[1] === m.id ? 'bg-accent text-accent-foreground font-medium' : ''"
                      @click="selectModule(m.id, 1)"
                    >
                      <div v-if="m.color" class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: m.color }" />
                      <span class="truncate flex-1">{{ m.name }}</span>
                      <svg v-if="m.children?.length" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>
                </div>

                <!-- Columna: Sub-nivel 2 -->
                <div v-if="level2Children.length" class="min-w-[170px] max-w-[170px] flex flex-col">
                  <div class="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b shrink-0 truncate">
                    {{ findModuleInTree(projectModules, selectedModuleIds[1])?.name }}
                  </div>
                  <div class="overflow-y-auto flex-1">
                    <button
                      v-for="m in level2Children"
                      :key="m.id"
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                      :class="selectedModuleIds[2] === m.id ? 'bg-accent text-accent-foreground font-medium' : ''"
                      @click="selectModule(m.id, 2)"
                    >
                      <div v-if="m.color" class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: m.color }" />
                      <span class="truncate flex-1">{{ m.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <!-- Breadcrumb -->
            <div v-if="selectionBreadcrumb.length" class="flex items-center gap-1 text-xs text-muted-foreground">
              <span v-for="(part, i) in selectionBreadcrumb" :key="i" class="flex items-center gap-1">
                <svg v-if="i > 0" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                <span :class="i === selectionBreadcrumb.length - 1 ? 'text-foreground font-medium' : ''">{{ part }}</span>
              </span>
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
