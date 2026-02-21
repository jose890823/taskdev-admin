<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { useBreadcrumbMeta } from '~/composables/useBreadcrumbMeta'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import { Separator } from '~/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '~/components/ui/popover'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select'
import type { TaskAssignee } from '~/modules/tasks/types'
import type { ProjectModule } from '~/modules/projects/types'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const route = useRoute()
const router = useRouter()
const taskId = route.params.id as string
const toast = useToast()
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl as string
const { accessToken } = useAuth()

const { setMeta } = useBreadcrumbMeta()

const {
  currentTask, subtasks, comments, loading, error,
  fetchById, fetchSubtasks, fetchComments, addComment,
  update, remove, createSubtask,
} = useTasks()

const {
  projects, projectModules, taskStatuses, globalStatuses, projectMembers,
  fetchAll: fetchProjects, fetchModules, fetchStatuses, fetchGlobalStatuses, fetchMembers,
} = useProjects()

// All statuses (project or global depending on task type)
const availableStatuses = computed(() => {
  if (currentTask.value?.projectId) return taskStatuses.value
  return globalStatuses.value
})

const newComment = ref('')
const newSubtaskTitle = ref('')
const showSubtaskInput = ref(false)
const newSubtaskAssigneeId = ref<string | null>(null)

// Edit state
const editingTitle = ref(false)
const editTitle = ref('')
const editingDescription = ref(false)
const editDescription = ref('')

// Priority options
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

// ── Module explorer state ──
const showModuleExplorer = ref(false)
const explorerProjectId = ref<string | null>(null)
const explorerModuleIds = ref<string[]>([])

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
  if (!explorerModuleIds.value[0]) return []
  const root = findModuleInTree(projectModules.value, explorerModuleIds.value[0])
  return root?.children || []
})

const level2Children = computed(() => {
  if (!explorerModuleIds.value[1]) return []
  const parent = findModuleInTree(projectModules.value, explorerModuleIds.value[1])
  return parent?.children || []
})

const explorerSelectProject = async (projectId: string | null) => {
  explorerProjectId.value = projectId
  explorerModuleIds.value = []
  if (projectId) {
    await fetchModules(projectId)
  }
}

const explorerSelectModule = (moduleId: string, level: number) => {
  const newIds = explorerModuleIds.value.slice(0, level)
  newIds[level] = moduleId
  explorerModuleIds.value = newIds
}

const explorerBreadcrumb = computed(() => {
  const parts: string[] = []
  if (explorerProjectId.value) {
    const proj = projects.value.find(p => p.id === explorerProjectId.value)
    if (proj) parts.push(proj.name)
  }
  for (const moduleId of explorerModuleIds.value) {
    const mod = findModuleInTree(projectModules.value, moduleId)
    if (mod) parts.push(mod.name)
  }
  return parts
})

// Current module name for display
const currentModuleName = computed(() => {
  if (!currentTask.value?.moduleId) return null
  const mod = findModuleInTree(projectModules.value, currentTask.value.moduleId)
  return mod?.name || null
})

const currentProjectName = computed(() => {
  if (!currentTask.value?.projectId) return null
  return projects.value.find(p => p.id === currentTask.value?.projectId)?.name || null
})

// Build the full path for the current module (walking up the tree)
const currentModulePath = computed(() => {
  const parts: string[] = []
  if (currentProjectName.value) parts.push(currentProjectName.value)
  if (currentTask.value?.moduleId) {
    // Walk from root to the target module
    const buildPath = (modules: ProjectModule[], targetId: string, path: string[]): string[] | null => {
      for (const m of modules) {
        if (m.id === targetId) return [...path, m.name]
        if (m.children?.length) {
          const found = buildPath(m.children, targetId, [...path, m.name])
          if (found) return found
        }
      }
      return null
    }
    const modulePath = buildPath(projectModules.value, currentTask.value.moduleId, [])
    if (modulePath) parts.push(...modulePath)
  }
  return parts
})

const openModuleExplorer = async () => {
  showModuleExplorer.value = true
  // Pre-select current project/module
  if (currentTask.value?.projectId) {
    explorerProjectId.value = currentTask.value.projectId
    await fetchModules(currentTask.value.projectId)
    // Pre-select module path
    if (currentTask.value.moduleId) {
      const buildSelectionPath = (modules: ProjectModule[], targetId: string, path: string[]): string[] | null => {
        for (const m of modules) {
          if (m.id === targetId) return [...path, m.id]
          if (m.children?.length) {
            const found = buildSelectionPath(m.children, targetId, [...path, m.id])
            if (found) return found
          }
        }
        return null
      }
      explorerModuleIds.value = buildSelectionPath(projectModules.value, currentTask.value.moduleId, []) || []
    } else {
      explorerModuleIds.value = []
    }
  } else {
    explorerProjectId.value = null
    explorerModuleIds.value = []
  }
}

const saveModuleSelection = async () => {
  const newModuleId = explorerModuleIds.value.length
    ? explorerModuleIds.value[explorerModuleIds.value.length - 1]
    : null
  await update(taskId, { moduleId: newModuleId })
  showModuleExplorer.value = false
  toast.success('Modulo actualizado')
}

const clearModuleSelection = async () => {
  await update(taskId, { moduleId: null })
  explorerModuleIds.value = []
  showModuleExplorer.value = false
  toast.success('Modulo removido')
}

onMounted(async () => {
  await Promise.all([
    fetchById(taskId),
    fetchSubtasks(taskId),
    fetchComments(taskId),
    fetchProjects(),
  ])
  // Set breadcrumb meta
  if (currentTask.value?.systemCode) {
    setMeta(taskId, {
      systemCode: currentTask.value.systemCode,
      uuid: currentTask.value.id,
      label: currentTask.value.title,
    })
  }
  // Load statuses, members, and modules after we know the task
  if (currentTask.value?.projectId) {
    await Promise.all([
      fetchStatuses(currentTask.value.projectId),
      fetchMembers(currentTask.value.projectId),
      fetchModules(currentTask.value.projectId),
    ])
  } else {
    await fetchGlobalStatuses()
  }
})

// ── Computed: current assignees ──

const currentAssigneeIds = computed<string[]>(() => {
  if (currentTask.value?.assignees?.length) {
    return currentTask.value.assignees.map(a => a.id)
  }
  if (currentTask.value?.assignedToId) return [currentTask.value.assignedToId]
  return []
})

const currentAssigneeNames = computed(() => {
  const assignees = currentTask.value?.assignees || []
  if (assignees.length === 0) {
    if (currentTask.value?.assignedTo) {
      const a = currentTask.value.assignedTo
      return a.firstName || a.lastName ? `${a.firstName || ''} ${a.lastName || ''}`.trim() : a.email
    }
    return 'Sin asignar'
  }
  const names = assignees.map(a =>
    a.firstName || a.lastName ? `${a.firstName || ''} ${a.lastName || ''}`.trim() : a.email,
  )
  if (names.length <= 2) return names.join(', ')
  return `${names[0]}, ${names[1]} +${names.length - 2}`
})

// Available assignees for subtasks: only parent's assignees (if parent has them)
const availableSubtaskAssignees = computed(() => {
  const parentAssignees = currentTask.value?.assignees || []
  if (parentAssignees.length === 0) {
    // If parent has no assignees, allow all project members
    return projectMembers.value
  }
  // Filter project members to only those who are assignees of the parent
  const parentIds = new Set(parentAssignees.map(a => a.id))
  return projectMembers.value.filter(m => parentIds.has(m.userId))
})

// Default assignee for new subtasks: first parent assignee (if any)
const defaultSubtaskAssigneeId = computed(() => {
  const parentAssignees = currentTask.value?.assignees || []
  return parentAssignees.length > 0 ? parentAssignees[0].id : null
})

// ── Actions ──

const startEditTitle = () => {
  if (!currentTask.value) return
  editTitle.value = currentTask.value.title
  editingTitle.value = true
}

const saveTitle = async () => {
  if (!currentTask.value || !editTitle.value.trim()) return
  await update(taskId, { title: editTitle.value })
  editingTitle.value = false
  toast.success('Titulo actualizado')
}

const startEditDescription = () => {
  if (!currentTask.value) return
  editDescription.value = currentTask.value.description || ''
  editingDescription.value = true
}

const saveDescription = async () => {
  if (!currentTask.value) return
  await update(taskId, { description: editDescription.value || undefined })
  editingDescription.value = false
  toast.success('Descripcion actualizada')
}

const changeStatus = async (statusId: string) => {
  await update(taskId, { statusId })
  toast.success('Estado actualizado')
}

const changePriority = async (priority: string) => {
  await update(taskId, { priority: priority as any })
  toast.success('Prioridad actualizada')
}

const changeDueDate = async (date: string) => {
  await update(taskId, { dueDate: date || undefined })
  toast.success('Fecha actualizada')
}

const changeScheduledDate = async (date: string) => {
  await update(taskId, { scheduledDate: date || undefined })
  toast.success('Fecha programada actualizada')
}

const toggleAssignee = async (userId: string) => {
  const current = [...currentAssigneeIds.value]
  const idx = current.indexOf(userId)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(userId)
  }
  await update(taskId, { assignedToIds: current })
  toast.success('Asignados actualizados')
}

const completedStatus = computed(() => availableStatuses.value.find(s => s.isCompleted))

// Guarda el statusId anterior antes de completar, para restaurar al desmarcar
const previousStatusMap = ref<Record<string, string>>({})

const updateSubtaskStatus = async (subId: string, dto: { statusId: string }) => {
  await $fetch(`${apiUrl}/tasks/${subId}`, {
    method: 'PATCH',
    body: dto,
    headers: { Authorization: `Bearer ${accessToken.value}` },
  })
}

const toggleSubtaskComplete = async (sub: any) => {
  const isCompleted = !!sub.completedAt
  if (isCompleted) {
    // Restaurar estado anterior, o el default si no hay registro
    const prevId = previousStatusMap.value[sub.id]
    const fallback = availableStatuses.value.find(s => s.isDefault)
    const restoreId = prevId || fallback?.id
    if (restoreId) await updateSubtaskStatus(sub.id, { statusId: restoreId })
  } else {
    // Guardar estado actual antes de completar
    if (sub.statusId) previousStatusMap.value[sub.id] = sub.statusId
    if (completedStatus.value) await updateSubtaskStatus(sub.id, { statusId: completedStatus.value.id })
  }
  await fetchSubtasks(taskId)
}

const priorityHexColor: Record<string, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f97316',
  urgent: '#ef4444',
}

const handleCreateSubtask = async () => {
  if (!newSubtaskTitle.value.trim()) return
  const dto: any = { title: newSubtaskTitle.value }
  if (newSubtaskAssigneeId.value) {
    dto.assignedToIds = [newSubtaskAssigneeId.value]
  }
  const sub = await createSubtask(taskId, dto)
  if (sub) {
    newSubtaskTitle.value = ''
    newSubtaskAssigneeId.value = defaultSubtaskAssigneeId.value
    showSubtaskInput.value = false
    toast.success('Subtarea creada')
  }
}

const handleDelete = async () => {
  await remove(taskId)
  toast.success('Tarea eliminada')
  router.push('/tasks')
}

const handleAddComment = async () => {
  if (!newComment.value.trim()) return
  await addComment({ taskId, content: newComment.value })
  newComment.value = ''
}

const currentStatusName = computed(() => {
  if (!currentTask.value?.statusId) return null
  const status = availableStatuses.value.find(s => s.id === currentTask.value?.statusId)
  return status || null
})

const getInitials = (assignee: TaskAssignee) => {
  const f = assignee.firstName?.[0] || ''
  const l = assignee.lastName?.[0] || ''
  return (f + l).toUpperCase() || assignee.email[0].toUpperCase()
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="loading" class="text-center py-8 text-muted-foreground">Cargando...</div>

    <template v-else-if="currentTask">
      <!-- Header: Back + Title + Badges inline -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div v-if="!editingTitle" class="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" class="h-7 w-7 p-0 shrink-0 text-muted-foreground" @click="router.back()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Button>
            <h1 class="text-lg font-semibold tracking-tight truncate">{{ currentTask.title }}</h1>
            <Badge v-if="currentTask.systemCode" variant="secondary" class="text-[10px] px-1.5 py-0 shrink-0 font-mono">{{ currentTask.systemCode }}</Badge>
            <Badge variant="outline" class="text-xs shrink-0">{{ currentTask.type === 'daily' ? 'Diaria' : 'Proyecto' }}</Badge>
            <Badge v-if="currentStatusName" variant="outline" class="text-xs shrink-0" :style="{ borderColor: currentStatusName.color, color: currentStatusName.color }">
              <div class="w-2 h-2 rounded-full mr-1" :style="{ backgroundColor: currentStatusName.color }" />
              {{ currentStatusName.name }}
            </Badge>
            <Button size="sm" variant="ghost" class="h-6 px-2 text-xs text-muted-foreground" @click="startEditTitle">Editar</Button>
          </div>
          <div v-else class="flex items-center gap-2 max-w-lg">
            <Input v-model="editTitle" class="text-lg font-bold" @keyup.enter="saveTitle" />
            <Button size="sm" @click="saveTitle">Guardar</Button>
            <Button size="sm" variant="outline" @click="editingTitle = false">Cancelar</Button>
          </div>
          <!-- Inline description -->
          <div v-if="!editingDescription" class="mt-1">
            <div v-if="currentTask.description" class="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm" v-html="currentTask.description" />
            <button class="text-xs text-muted-foreground hover:text-foreground transition-colors" @click="startEditDescription">
              {{ currentTask.description ? 'Editar descripcion' : '+ Agregar descripcion' }}
            </button>
          </div>
          <div v-else class="space-y-2 mt-1">
            <RichTextEditor v-model="editDescription" placeholder="Describe la tarea en detalle..." :rows="4" />
            <div class="flex gap-2">
              <Button size="sm" @click="saveDescription">Guardar</Button>
              <Button size="sm" variant="outline" @click="editingDescription = false">Cancelar</Button>
            </div>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="destructive" size="sm" class="shrink-0">Eliminar</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
              <AlertDialogDescription>
                Estas seguro de eliminar "{{ currentTask.title }}"? Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction @click="handleDelete">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <!-- Main content: 2 column layout (content left, sidebar right) -->
      <div class="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-3">
        <!-- Left: Properties + Comments stacked -->
        <div class="space-y-3">
          <!-- Properties compact -->
          <Card>
            <CardContent class="p-4 space-y-3">
              <!-- Status + Priority in one row -->
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1.5">
                  <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</p>
                  <div class="flex flex-wrap gap-1">
                    <Button
                      v-for="status in availableStatuses"
                      :key="status.id"
                      size="sm"
                      class="h-7 text-xs border"
                      variant="outline"
                      :style="currentTask.statusId === status.id
                        ? { backgroundColor: status.color, borderColor: status.color, color: '#fff' }
                        : {}"
                      @click="changeStatus(status.id)"
                    >
                      <div class="w-2 h-2 rounded-full mr-1" :style="{ backgroundColor: currentTask.statusId === status.id ? '#fff' : status.color }" />
                      {{ status.name }}
                    </Button>
                  </div>
                </div>
                <div class="space-y-1.5 shrink-0">
                  <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Prioridad</p>
                  <div class="flex gap-1">
                    <Button
                      v-for="p in priorities"
                      :key="p.value"
                      size="sm"
                      class="h-7 text-xs border-0"
                      variant="default"
                      :class="[p.class, currentTask.priority !== p.value ? 'opacity-35' : '']"
                      @click="changePriority(p.value)"
                    >
                      {{ p.label }}
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Dates + Assignees in one row -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div class="space-y-1">
                  <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Programada</p>
                  <Input
                    type="date"
                    :model-value="currentTask.scheduledDate?.split('T')[0] || ''"
                    class="h-8 text-sm"
                    @change="changeScheduledDate(($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Limite</p>
                  <Input
                    type="date"
                    :model-value="currentTask.dueDate?.split('T')[0] || ''"
                    class="h-8 text-sm"
                    @change="changeDueDate(($event.target as HTMLInputElement).value)"
                  />
                </div>
                <!-- Multi-select assignees with Popover -->
                <div v-if="projectMembers.length > 0" class="space-y-1 col-span-2 sm:col-span-1">
                  <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Asignados</p>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button variant="outline" class="h-8 text-sm w-full justify-start font-normal truncate">
                        <div v-if="currentAssigneeIds.length > 0" class="flex items-center gap-1 truncate">
                          <div class="flex -space-x-1">
                            <div
                              v-for="assignee in (currentTask?.assignees || []).slice(0, 3)"
                              :key="assignee.id"
                              class="w-4 h-4 rounded-full bg-primary/20 text-primary text-[8px] font-semibold flex items-center justify-center ring-1 ring-background"
                            >
                              {{ getInitials(assignee) }}
                            </div>
                          </div>
                          <span class="truncate text-xs">{{ currentAssigneeNames }}</span>
                        </div>
                        <span v-else class="text-muted-foreground">Sin asignar</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-56 p-2" align="start">
                      <div class="space-y-1">
                        <p class="text-xs font-medium text-muted-foreground px-1 pb-1">Seleccionar asignados</p>
                        <div
                          v-for="member in projectMembers"
                          :key="member.userId"
                          class="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted cursor-pointer"
                          @click="toggleAssignee(member.userId)"
                        >
                          <Checkbox
                            :checked="currentAssigneeIds.includes(member.userId)"
                            class="pointer-events-none"
                          />
                          <span class="w-5 h-5 rounded-full bg-primary/20 text-primary text-[9px] font-semibold flex items-center justify-center shrink-0">
                            {{ (member.user?.firstName?.[0] || '') + (member.user?.lastName?.[0] || '') || member.user?.email?.[0]?.toUpperCase() }}
                          </span>
                          <span class="text-sm truncate">
                            {{ member.user?.firstName }} {{ member.user?.lastName }}
                          </span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <!-- Proyecto / Modulo -->
              <div v-if="currentTask.projectId" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proyecto / Modulo</p>
                  <button
                    type="button"
                    class="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    @click="showModuleExplorer ? (showModuleExplorer = false) : openModuleExplorer()"
                  >
                    {{ showModuleExplorer ? 'Cerrar' : 'Cambiar' }}
                  </button>
                </div>
                <!-- Current path display -->
                <div v-if="!showModuleExplorer" class="flex items-center gap-1 text-sm">
                  <span v-for="(part, i) in currentModulePath" :key="i" class="flex items-center gap-1">
                    <svg v-if="i > 0" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
                    <span :class="i === currentModulePath.length - 1 ? 'font-medium' : 'text-muted-foreground'">{{ part }}</span>
                  </span>
                  <span v-if="!currentModulePath.length" class="text-muted-foreground">Sin modulo asignado</span>
                </div>
                <!-- Module Explorer -->
                <div v-if="showModuleExplorer" class="space-y-2">
                  <div class="border rounded-lg overflow-hidden">
                    <div class="flex overflow-x-auto" style="height: 180px;">
                      <!-- Columna: Modulos raiz -->
                      <div class="min-w-[160px] max-w-[160px] border-r flex flex-col">
                        <div class="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b shrink-0">
                          Modulos
                        </div>
                        <div class="overflow-y-auto flex-1">
                          <button
                            v-for="m in rootModules"
                            :key="m.id"
                            type="button"
                            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                            :class="explorerModuleIds[0] === m.id ? 'bg-accent text-accent-foreground font-medium' : ''"
                            @click="explorerSelectModule(m.id, 0)"
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
                      <div v-if="level1Children.length" class="min-w-[160px] max-w-[160px] border-r flex flex-col">
                        <div class="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b shrink-0 truncate">
                          {{ findModuleInTree(projectModules, explorerModuleIds[0])?.name }}
                        </div>
                        <div class="overflow-y-auto flex-1">
                          <button
                            v-for="m in level1Children"
                            :key="m.id"
                            type="button"
                            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                            :class="explorerModuleIds[1] === m.id ? 'bg-accent text-accent-foreground font-medium' : ''"
                            @click="explorerSelectModule(m.id, 1)"
                          >
                            <div v-if="m.color" class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: m.color }" />
                            <span class="truncate flex-1">{{ m.name }}</span>
                            <svg v-if="m.children?.length" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
                          </button>
                        </div>
                      </div>

                      <!-- Columna: Sub-nivel 2 -->
                      <div v-if="level2Children.length" class="min-w-[160px] max-w-[160px] flex flex-col">
                        <div class="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 border-b shrink-0 truncate">
                          {{ findModuleInTree(projectModules, explorerModuleIds[1])?.name }}
                        </div>
                        <div class="overflow-y-auto flex-1">
                          <button
                            v-for="m in level2Children"
                            :key="m.id"
                            type="button"
                            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors"
                            :class="explorerModuleIds[2] === m.id ? 'bg-accent text-accent-foreground font-medium' : ''"
                            @click="explorerSelectModule(m.id, 2)"
                          >
                            <div v-if="m.color" class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: m.color }" />
                            <span class="truncate flex-1">{{ m.name }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- Explorer breadcrumb -->
                  <div v-if="explorerBreadcrumb.length" class="flex items-center gap-1 text-xs text-muted-foreground">
                    <span v-for="(part, i) in explorerBreadcrumb" :key="i" class="flex items-center gap-1">
                      <svg v-if="i > 0" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                      <span :class="i === explorerBreadcrumb.length - 1 ? 'text-foreground font-medium' : ''">{{ part }}</span>
                    </span>
                  </div>
                  <!-- Action buttons -->
                  <div class="flex items-center gap-2">
                    <Button size="sm" class="h-7 text-xs" :disabled="!explorerModuleIds.length" @click="saveModuleSelection">
                      Guardar
                    </Button>
                    <Button v-if="currentTask.moduleId" size="sm" variant="ghost" class="h-7 text-xs text-muted-foreground" @click="clearModuleSelection">
                      Quitar modulo
                    </Button>
                    <Button size="sm" variant="outline" class="h-7 text-xs" @click="showModuleExplorer = false">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Comments -->
          <Card>
            <CardContent class="p-4 space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold">Comentarios ({{ comments.length }})</p>
              </div>
              <div v-if="comments.length === 0" class="text-muted-foreground text-xs">Sin comentarios</div>
              <div v-else class="space-y-3">
                <div v-for="comment in comments" :key="comment.id" class="flex gap-2.5">
                  <!-- Author avatar -->
                  <div
                    class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5"
                    :class="comment.userId === accessToken ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'"
                    :title="comment.author ? `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() || comment.author.email : ''"
                  >
                    {{ comment.author
                      ? ((comment.author.firstName?.[0] || '') + (comment.author.lastName?.[0] || '')).toUpperCase() || comment.author.email[0].toUpperCase()
                      : '?' }}
                  </div>
                  <!-- Comment body -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2">
                      <span class="text-xs font-semibold">
                        {{ comment.author
                          ? (comment.author.firstName || comment.author.lastName
                            ? `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim()
                            : comment.author.email)
                          : 'Usuario' }}
                      </span>
                      <span class="text-[10px] text-muted-foreground">
                        {{ new Date(comment.createdAt).toLocaleString() }}
                      </span>
                    </div>
                    <div class="prose prose-sm dark:prose-invert max-w-none text-sm mt-0.5" v-html="comment.content" />
                  </div>
                </div>
              </div>
              <div class="space-y-1.5">
                <RichTextEditor v-model="newComment" placeholder="Agregar comentario..." :rows="2" />
                <div class="flex justify-end">
                  <Button size="sm" :disabled="!newComment.trim()" @click="handleAddComment">Enviar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right sidebar: Subtasks -->
        <div>
          <Card>
            <CardContent class="p-4 space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold">Subtareas ({{ subtasks.length }})</p>
                <Button size="sm" variant="ghost" class="h-6 px-2 text-xs" @click="() => { showSubtaskInput = !showSubtaskInput; if (showSubtaskInput) newSubtaskAssigneeId = defaultSubtaskAssigneeId }">
                  {{ showSubtaskInput ? 'Cancelar' : '+ Agregar' }}
                </Button>
              </div>
              <div v-if="showSubtaskInput" class="space-y-1.5 pb-2 border-b">
                <div class="flex gap-1.5">
                  <Input v-model="newSubtaskTitle" placeholder="Subtarea..." class="flex-1 h-7 text-xs" @keyup.enter="handleCreateSubtask" />
                  <Button size="sm" class="h-7 text-xs" :disabled="!newSubtaskTitle.trim()" @click="handleCreateSubtask">Crear</Button>
                </div>
                <!-- Subtask assignee selector (filtered to parent's assignees) -->
                <div v-if="availableSubtaskAssignees.length > 0" class="flex items-center gap-1.5">
                  <Select
                    :model-value="newSubtaskAssigneeId || 'none'"
                    @update:model-value="(val: any) => newSubtaskAssigneeId = val === 'none' ? null : String(val)"
                  >
                    <SelectTrigger class="h-7 text-xs">
                      <SelectValue placeholder="Asignar a..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      <SelectItem
                        v-for="member in availableSubtaskAssignees"
                        :key="member.userId"
                        :value="member.userId"
                      >
                        {{ member.user?.firstName }} {{ member.user?.lastName }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div v-if="subtasks.length === 0 && !showSubtaskInput" class="text-muted-foreground text-xs py-2">Sin subtareas</div>
              <div v-for="sub in subtasks" :key="sub.id" class="flex items-center gap-1.5 py-1 border-b border-border/50 last:border-0">
                <button
                  type="button"
                  class="w-2.5 h-2.5 shrink-0 rounded-full border-2 transition-colors"
                  :style="{ borderColor: sub.completedAt ? '#22c55e' : (priorityHexColor[sub.priority] || '#6b7280'), backgroundColor: sub.completedAt ? '#22c55e' : 'transparent' }"
                  @click="toggleSubtaskComplete(sub)"
                />
                <span
                  class="text-xs flex-1 truncate cursor-pointer select-none"
                  :class="{ 'line-through opacity-50': sub.completedAt }"
                  @click="toggleSubtaskComplete(sub)"
                >
                  {{ sub.title }}
                </span>
                <!-- Subtask assignee avatars -->
                <div v-if="sub.assignees?.length" class="flex -space-x-1 shrink-0">
                  <div
                    v-for="a in sub.assignees.slice(0, 2)"
                    :key="a.id"
                    class="w-4 h-4 rounded-full bg-primary/20 text-primary text-[7px] font-semibold flex items-center justify-center ring-1 ring-background"
                    :title="a.firstName ? `${a.firstName} ${a.lastName || ''}`.trim() : a.email"
                  >
                    {{ getInitials(a) }}
                  </div>
                </div>
                <Badge v-if="sub.priority" variant="outline" class="text-[10px] px-1 py-0 shrink-0" :class="priorityColor[sub.priority]">
                  {{ priorities.find(p => p.value === sub.priority)?.label || sub.priority }}
                </Badge>
                <NuxtLink :to="`/tasks/${sub.id}`" class="shrink-0 ml-2 text-muted-foreground hover:text-foreground transition-colors" title="Editar subtarea">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                </NuxtLink>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
