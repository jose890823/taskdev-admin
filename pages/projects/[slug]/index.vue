<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select'
import DataTable from '~/components/shared/DataTable/DataTable.vue'
import type { ColumnDef } from '~/components/shared/DataTable/types'
import type { Task } from '~/modules/tasks/types'
import type { ProjectModule } from '~/modules/projects/types'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string
const toast = useToast()

const {
  currentProject, projectModules, taskStatuses, projectMembers, projectInvitations,
  loading, error,
  fetchBySlug, fetchModules, fetchStatuses, fetchMembers,
  update, createModule, updateModule, deleteModule, createStatus, deleteStatus,
  addMember, removeMember, inviteByEmail, fetchProjectInvitations,
} = useProjects()

const { tasks: projectTasks, loading: tasksLoading, fetchAll: fetchTasks, bulkUpdatePositions, remove: removeTask } = useTasks()

// ── Edit project ──
const editingName = ref(false)
const editName = ref('')
const editDescription = ref('')
const editColor = ref('')

const startEdit = () => {
  if (!currentProject.value) return
  editName.value = currentProject.value.name
  editDescription.value = currentProject.value.description || ''
  editColor.value = currentProject.value.color || '#6366f1'
  editingName.value = true
}

const saveProject = async () => {
  if (!currentProject.value || !editName.value.trim()) return
  await update(currentProject.value.id, {
    name: editName.value,
    description: editDescription.value || undefined,
    color: editColor.value,
  })
  editingName.value = false
  toast.success('Proyecto actualizado')
}

// ── Modules ──
const newModuleName = ref('')
const newModuleColor = ref('#6366f1')
const showModuleInput = ref(false)
const submoduleParentId = ref<string | null>(null)
const expandedModules = ref<Set<string>>(new Set())

const toggleExpand = (id: string) => {
  const s = expandedModules.value
  if (s.has(id)) s.delete(id)
  else s.add(id)
}

const startSubmoduleCreate = (parentId: string) => {
  submoduleParentId.value = parentId
  showModuleInput.value = true
  newModuleName.value = ''
  newModuleColor.value = '#6366f1'
}

const cancelModuleCreate = () => {
  showModuleInput.value = false
  submoduleParentId.value = null
  newModuleName.value = ''
  newModuleColor.value = '#6366f1'
}

const getModuleName = (id: string): string => {
  const find = (mods: typeof projectModules.value): string | null => {
    for (const m of mods) {
      if (m.id === id) return m.name
      if (m.children?.length) {
        const found = find(m.children)
        if (found) return found
      }
    }
    return null
  }
  return find(projectModules.value) || 'Modulo'
}

const countAllModules = (mods: typeof projectModules.value): number => {
  let count = 0
  for (const m of mods) {
    count++
    if (m.children?.length) count += countAllModules(m.children)
  }
  return count
}

const getModuleDepth = (mod: typeof projectModules.value[0], mods: typeof projectModules.value): number => {
  if (!mod.parentId) return 0
  const find = (list: typeof mods, depth: number): number => {
    for (const m of list) {
      if (m.id === mod.parentId) return depth + 1
      if (m.children?.length) {
        const found = find(m.children, depth + 1)
        if (found >= 0) return found
      }
    }
    return -1
  }
  return find(mods, 0)
}

const handleCreateModule = async () => {
  if (!currentProject.value || !newModuleName.value.trim()) return
  try {
    const dto: any = { name: newModuleName.value, color: newModuleColor.value }
    if (submoduleParentId.value) dto.parentId = submoduleParentId.value
    await createModule(currentProject.value.id, dto)
    if (submoduleParentId.value) expandedModules.value.add(submoduleParentId.value)
    cancelModuleCreate()
    toast.success('Modulo creado')
  } catch {
    toast.error('Error', error.value || 'No se pudo crear el modulo')
  }
}

// ── Edit module inline ──
const editingModuleId = ref<string | null>(null)
const editModuleName = ref('')
const editModuleColor = ref('')

const startEditModule = (mod: { id: string; name: string; color?: string }) => {
  editingModuleId.value = mod.id
  editModuleName.value = mod.name
  editModuleColor.value = mod.color || '#8b5cf6'
}

const cancelEditModule = () => {
  editingModuleId.value = null
  editModuleName.value = ''
  editModuleColor.value = ''
}

const handleUpdateModule = async () => {
  if (!editingModuleId.value || !editModuleName.value.trim()) return
  try {
    await updateModule(editingModuleId.value, { name: editModuleName.value, color: editModuleColor.value })
    if (currentProject.value) await fetchModules(currentProject.value.id)
    cancelEditModule()
    toast.success('Modulo actualizado')
  } catch {
    toast.error('Error', error.value || 'No se pudo actualizar el modulo')
  }
}

const handleDeleteModule = async (moduleId: string) => {
  try {
    await deleteModule(moduleId, currentProject.value?.id)
    toast.success('Modulo eliminado')
  } catch {
    toast.error('Error', error.value || 'No se pudo eliminar el modulo')
  }
}

// ── Statuses ──
const newStatusName = ref('')
const newStatusColor = ref('#6b7280')
const showStatusInput = ref(false)

const handleCreateStatus = async () => {
  if (!currentProject.value || !newStatusName.value.trim()) return
  try {
    await createStatus(currentProject.value.id, { name: newStatusName.value, color: newStatusColor.value })
    newStatusName.value = ''
    newStatusColor.value = '#6b7280'
    showStatusInput.value = false
    toast.success('Estado creado')
  } catch {
    toast.error('Error', error.value || 'No se pudo crear el estado')
  }
}

const handleDeleteStatus = async (statusId: string) => {
  try {
    await deleteStatus(statusId)
    toast.success('Estado eliminado')
  } catch {
    toast.error('Error', error.value || 'No se pudo eliminar el estado')
  }
}

// ── Members ──
const inviteEmail = ref('')
const inviteRole = ref<'member' | 'admin' | 'viewer'>('member')
const showMemberInput = ref(false)
const inviting = ref(false)

const handleInvite = async () => {
  if (!currentProject.value || !inviteEmail.value.trim()) return
  inviting.value = true
  try {
    const result = await inviteByEmail(currentProject.value.id, { email: inviteEmail.value, role: inviteRole.value })
    inviteEmail.value = ''
    inviteRole.value = 'member'
    showMemberInput.value = false
    if (result?.action === 'added') {
      toast.success('Miembro agregado directamente al proyecto')
    } else {
      toast.success('Invitacion enviada por email')
      await fetchProjectInvitations(currentProject.value.id)
    }
  } catch {
    toast.error('Error', error.value || 'No se pudo invitar al miembro')
  } finally {
    inviting.value = false
  }
}

const handleRemoveMember = async (userId: string) => {
  if (!currentProject.value) return
  try {
    await removeMember(currentProject.value.id, userId)
    toast.success('Miembro eliminado')
  } catch {
    toast.error('Error', error.value || 'No se pudo eliminar el miembro')
  }
}

// ── Kanban ──
const handleBulkUpdate = async (items: import('~/modules/tasks/types').BulkPositionItem[]) => {
  await bulkUpdatePositions(items)
}

const handleTaskCreatedFromBoard = async () => {
  if (currentProject.value) {
    await fetchTasks({ projectId: currentProject.value.id, limit: 500 })
  }
}

// ── Tasks Tab ──
const taskSearch = ref('')
const taskFilterStatus = ref('all')
const taskFilterPriority = ref('all')

const filteredProjectTasks = computed(() => {
  let result = projectTasks.value
  if (taskSearch.value) {
    const term = taskSearch.value.toLowerCase()
    result = result.filter(t => t.title.toLowerCase().includes(term))
  }
  if (taskFilterStatus.value !== 'all') {
    result = result.filter(t => t.statusId === taskFilterStatus.value)
  }
  if (taskFilterPriority.value !== 'all') {
    result = result.filter(t => t.priority === taskFilterPriority.value)
  }
  return result
})

const hasTaskFilters = computed(() =>
  taskSearch.value || taskFilterStatus.value !== 'all' || taskFilterPriority.value !== 'all'
)

const clearTaskFilters = () => {
  taskSearch.value = ''
  taskFilterStatus.value = 'all'
  taskFilterPriority.value = 'all'
}

const taskColumns: ColumnDef<Task>[] = [
  { key: 'status', label: '', width: '40px', sortable: false, searchable: false },
  { key: 'title', label: 'Titulo', sortable: true, searchable: true },
  { key: 'systemCode', label: 'Codigo', sortable: true, width: '200px', searchable: true },
  { key: 'module', label: 'Modulo', sortable: false, searchable: false, width: '180px' },
  { key: 'assignees', label: 'Asignados', width: '160px', sortable: false },
  { key: 'priority', label: 'Prioridad', sortable: true, width: '100px', align: 'center' },
  { key: 'statusName', label: 'Estado', sortable: false, width: '120px', align: 'center' },
  {
    key: 'dueDate', label: 'Fecha limite', sortable: true, width: '120px', align: 'center',
    format: (value: string | null) => {
      if (!value) return '-'
      return new Date(value).toLocaleDateString('es', { day: '2-digit', month: 'short' })
    },
  },
  { key: 'commentCount', label: 'Comentarios', sortable: true, width: '110px', align: 'center' },
  { key: 'subtaskCount', label: 'Subtareas', sortable: true, width: '100px', align: 'center' },
  { key: 'actions', label: '', width: '50px', sortable: false, searchable: false, align: 'center' },
]

const getTaskStatusInfo = (statusId: string | null | undefined) => {
  if (!statusId) return null
  return taskStatuses.value.find(s => s.id === statusId)
}

const getAssigneeInitials = (assignee: { firstName: string; lastName: string }) => {
  return ((assignee.firstName?.[0] || '') + (assignee.lastName?.[0] || '')).toUpperCase() || '?'
}

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
  if (!task.moduleId) return []
  return buildModulePath(projectModules.value, task.moduleId, []) || []
}

const handleDeleteTask = async (task: Task) => {
  await removeTask(task.id)
  toast.success('Tarea eliminada')
}

const handleTaskRowClick = (row: Task) => {
  router.push(`/tasks/${row.id}`)
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

// ── Helpers ──
const getMemberName = (member: any): string => {
  if (member.user?.firstName) {
    return `${member.user.firstName} ${member.user.lastName || ''}`.trim()
  }
  return member.userId.slice(0, 12) + '...'
}

const getMemberEmail = (member: any): string | null => {
  return member.user?.email || null
}

const getMemberInitials = (member: any): string => {
  if (member.user?.firstName && member.user?.lastName) {
    return (member.user.firstName[0] + member.user.lastName[0]).toUpperCase()
  }
  return member.userId.slice(0, 2).toUpperCase()
}

const roleLabels: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  member: 'Miembro',
  viewer: 'Observador',
}

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

onMounted(async () => {
  await fetchBySlug(slug)
  if (currentProject.value) {
    const promises: Promise<any>[] = [
      fetchModules(currentProject.value.id),
      fetchStatuses(currentProject.value.id),
      fetchMembers(currentProject.value.id),
      fetchTasks({ projectId: currentProject.value.id }),
    ]
    if (currentProject.value.organizationId) {
      promises.push(fetchProjectInvitations(currentProject.value.id))
    }
    await Promise.all(promises)
  }
})
</script>

<template>
  <div class="space-y-2">
    <div v-if="loading" class="text-center py-8 text-muted-foreground">Cargando...</div>

    <template v-else-if="currentProject">
      <!-- Header with back button -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" class="h-7 w-7 p-0 text-muted-foreground" @click="router.push('/projects')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <div
            v-if="currentProject.color"
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: currentProject.color }"
          />
          <div v-if="!editingName">
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-semibold tracking-tight leading-tight">{{ currentProject.name }}</h1>
              <Badge v-if="currentProject.systemCode" variant="secondary" class="text-[10px] px-1.5 py-0 font-mono">{{ currentProject.systemCode }}</Badge>
            </div>
            <p v-if="currentProject.description" class="text-xs text-muted-foreground" v-html="currentProject.description" />
            <p v-else class="text-xs text-muted-foreground">{{ currentProject.slug }}</p>
          </div>
          <div v-else class="space-y-2 max-w-2xl">
            <Input v-model="editName" class="text-lg font-bold" />
            <RichTextEditor v-model="editDescription" placeholder="Describe el proyecto..." :rows="5" />
            <div class="flex items-center gap-2">
              <input type="color" v-model="editColor" class="w-8 h-8 rounded cursor-pointer border-0 p-0" />
              <Button size="sm" @click="saveProject">Guardar</Button>
              <Button size="sm" variant="outline" @click="editingName = false">Cancelar</Button>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <Button v-if="!editingName" variant="outline" size="sm" @click="startEdit">Editar</Button>
          <Button v-if="currentProject.organizationId" variant="outline" size="sm" @click="router.push(`/projects/${slug}/board`)">
            Tablero
          </Button>
          <Badge variant="outline">{{ currentProject.organizationId ? 'Organizacion' : 'Personal' }}</Badge>
        </div>
      </div>

      <Tabs default-value="overview" class="w-full">
        <TabsList>
          <TabsTrigger value="overview">General</TabsTrigger>
          <TabsTrigger value="tasks">Tareas ({{ projectTasks.length }})</TabsTrigger>
          <TabsTrigger value="board">Tablero</TabsTrigger>
          <TabsTrigger value="members">Miembros ({{ projectMembers.length }})</TabsTrigger>
        </TabsList>

        <!-- Tab: General (Modules + Statuses) -->
        <TabsContent value="overview">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <!-- Modules Tree -->
            <Card>
              <CardContent class="p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold">Modulos ({{ countAllModules(projectModules) }})</p>
                  <Button size="sm" variant="outline" class="h-7 text-xs" @click="showModuleInput ? cancelModuleCreate() : (showModuleInput = true)">
                    {{ showModuleInput ? 'Cancelar' : 'Agregar' }}
                  </Button>
                </div>

                <!-- Add module form -->
                <div v-if="showModuleInput" class="space-y-2 pb-3 border-b">
                  <div v-if="submoduleParentId" class="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>
                    Submodulo de: <span class="font-medium text-foreground">{{ getModuleName(submoduleParentId) }}</span>
                    <button class="ml-auto text-[10px] underline hover:text-foreground" @click="submoduleParentId = null">Modulo raiz</button>
                  </div>
                  <div class="flex items-center gap-2">
                    <input type="color" v-model="newModuleColor" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                    <Input v-model="newModuleName" placeholder="Nombre del modulo" class="flex-1" @keyup.enter="handleCreateModule" />
                    <Button size="sm" :disabled="!newModuleName.trim()" @click="handleCreateModule">Crear</Button>
                  </div>
                </div>

                <div v-if="projectModules.length === 0 && !showModuleInput" class="text-muted-foreground text-xs py-2 text-center">
                  Sin modulos
                </div>

                <!-- Module Tree -->
                <div v-if="projectModules.length" class="space-y-1 pt-1">
                  <template v-for="(mod, modIdx) in projectModules" :key="mod.id">
                    <!-- Root module (Level 0) — group header -->
                    <div class="group/root rounded-md border border-border/60 bg-muted/30 overflow-hidden">
                      <div class="flex items-center justify-between px-2.5 py-1.5">
                        <!-- Editing mode -->
                        <div v-if="editingModuleId === mod.id" class="flex items-center gap-2 flex-1 min-w-0">
                          <input type="color" v-model="editModuleColor" class="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0" />
                          <Input v-model="editModuleName" class="h-7 text-xs flex-1" @keyup.enter="handleUpdateModule" @keyup.escape="cancelEditModule" />
                          <Button size="sm" variant="default" class="h-6 px-2 text-[11px]" :disabled="!editModuleName.trim()" @click="handleUpdateModule">Ok</Button>
                          <Button size="sm" variant="ghost" class="h-6 px-2 text-[11px]" @click="cancelEditModule">No</Button>
                        </div>
                        <!-- View mode -->
                        <template v-else>
                          <div class="flex items-center gap-2 min-w-0">
                            <button
                              v-if="mod.children?.length"
                              class="w-4 h-4 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-transform duration-150"
                              :class="{ 'rotate-90': expandedModules.has(mod.id) }"
                              @click="toggleExpand(mod.id)"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                            <div v-else class="w-4 shrink-0" />
                            <div class="w-3 h-3 rounded shrink-0" :style="{ backgroundColor: mod.color || '#8b5cf6' }" />
                            <span class="text-xs font-semibold truncate">{{ mod.name }}</span>
                            <Badge v-if="mod.children?.length" variant="secondary" class="text-[9px] px-1 py-0 h-4 shrink-0">
                              {{ countAllModules(mod.children) }}
                            </Badge>
                          </div>
                          <div class="flex items-center gap-0.5 opacity-0 group-hover/root:opacity-100 transition-opacity shrink-0">
                            <Button size="sm" variant="ghost" class="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" title="Editar" @click="startEditModule(mod)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                            </Button>
                            <Button size="sm" variant="ghost" class="h-6 w-6 p-0 text-muted-foreground hover:text-primary" title="Agregar submodulo" @click="startSubmoduleCreate(mod.id)">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger as-child>
                                <Button size="sm" variant="ghost" class="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar modulo</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Estas seguro de eliminar "{{ mod.name }}"?
                                    <template v-if="mod.children?.length"> Tambien se eliminaran {{ countAllModules(mod.children) }} submodulo(s).</template>
                                    Esta accion no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction @click="handleDeleteModule(mod.id)">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </template>
                      </div>

                      <!-- Level 1 children — tree inside the group -->
                      <div v-if="mod.children?.length && expandedModules.has(mod.id)" class="border-t border-border/40 bg-background/50">
                        <template v-for="(child, childIdx) in mod.children" :key="child.id">
                          <div class="group/child">
                            <div class="flex items-center justify-between pl-3 pr-2.5 py-1.5" :class="{ 'border-t border-border/30': childIdx > 0 }">
                              <!-- Editing mode -->
                              <div v-if="editingModuleId === child.id" class="flex items-center gap-2 flex-1 min-w-0 pl-5">
                                <input type="color" v-model="editModuleColor" class="w-5 h-5 rounded cursor-pointer border-0 p-0 shrink-0" />
                                <Input v-model="editModuleName" class="h-7 text-xs flex-1" @keyup.enter="handleUpdateModule" @keyup.escape="cancelEditModule" />
                                <Button size="sm" variant="default" class="h-6 px-2 text-[11px]" :disabled="!editModuleName.trim()" @click="handleUpdateModule">Ok</Button>
                                <Button size="sm" variant="ghost" class="h-6 px-2 text-[11px]" @click="cancelEditModule">No</Button>
                              </div>
                              <!-- View mode -->
                              <template v-else>
                                <div class="flex items-center gap-0 min-w-0">
                                  <div class="w-5 h-full flex items-center shrink-0">
                                    <svg width="16" height="20" viewBox="0 0 16 20" class="text-border shrink-0">
                                      <path :d="childIdx < mod.children!.length - 1 ? 'M8 0 V20 M8 10 H16' : 'M8 0 V10 H16'" fill="none" stroke="currentColor" stroke-width="1.5"/>
                                    </svg>
                                  </div>
                                  <button
                                    v-if="child.children?.length"
                                    class="w-4 h-4 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-transform duration-150"
                                    :class="{ 'rotate-90': expandedModules.has(child.id) }"
                                    @click="toggleExpand(child.id)"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                  </button>
                                  <div v-else class="w-4 shrink-0" />
                                  <div class="w-2.5 h-2.5 rounded-sm shrink-0 ml-1" :style="{ backgroundColor: child.color || '#8b5cf6' }" />
                                  <span class="text-xs ml-1.5 truncate">{{ child.name }}</span>
                                  <Badge v-if="child.children?.length" variant="outline" class="text-[9px] px-1 py-0 h-4 ml-1.5 shrink-0">
                                    {{ child.children.length }}
                                  </Badge>
                                </div>
                                <div class="flex items-center gap-0.5 opacity-0 group-hover/child:opacity-100 transition-opacity shrink-0">
                                  <Button size="sm" variant="ghost" class="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" title="Editar" @click="startEditModule(child)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                                  </Button>
                                  <Button size="sm" variant="ghost" class="h-6 w-6 p-0 text-muted-foreground hover:text-primary" title="Agregar submodulo" @click="startSubmoduleCreate(child.id)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger as-child>
                                      <Button size="sm" variant="ghost" class="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Eliminar submodulo</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Estas seguro de eliminar "{{ child.name }}"?
                                          <template v-if="child.children?.length"> Tambien se eliminaran {{ child.children.length }} submodulo(s).</template>
                                          Esta accion no se puede deshacer.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction @click="handleDeleteModule(child.id)">Eliminar</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </template>
                            </div>

                            <!-- Level 2 grandchildren — deepest level inside child -->
                            <div v-if="child.children?.length && expandedModules.has(child.id)" class="bg-muted/20">
                              <template v-for="(grandchild, gcIdx) in child.children" :key="grandchild.id">
                                <div
                                  class="group/gc flex items-center justify-between pl-8 pr-2.5 py-1"
                                  :class="{ 'border-t border-border/20': true }"
                                >
                                  <!-- Editing mode -->
                                  <div v-if="editingModuleId === grandchild.id" class="flex items-center gap-2 flex-1 min-w-0 pl-5">
                                    <input type="color" v-model="editModuleColor" class="w-5 h-5 rounded cursor-pointer border-0 p-0 shrink-0" />
                                    <Input v-model="editModuleName" class="h-6 text-[11px] flex-1" @keyup.enter="handleUpdateModule" @keyup.escape="cancelEditModule" />
                                    <Button size="sm" variant="default" class="h-5 px-2 text-[10px]" :disabled="!editModuleName.trim()" @click="handleUpdateModule">Ok</Button>
                                    <Button size="sm" variant="ghost" class="h-5 px-2 text-[10px]" @click="cancelEditModule">No</Button>
                                  </div>
                                  <!-- View mode -->
                                  <template v-else>
                                    <div class="flex items-center gap-0 min-w-0">
                                      <div class="w-5 h-full flex items-center shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 16 16" class="text-border/60 shrink-0">
                                          <path :d="gcIdx < child.children!.length - 1 ? 'M8 0 V16 M8 8 H16' : 'M8 0 V8 H16'" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2"/>
                                        </svg>
                                      </div>
                                      <div class="w-2 h-2 rounded-full shrink-0 ml-1" :style="{ backgroundColor: grandchild.color || '#8b5cf6', opacity: 0.7 }" />
                                      <span class="text-[11px] text-muted-foreground ml-1.5 truncate">{{ grandchild.name }}</span>
                                    </div>
                                    <div class="flex items-center gap-0.5 opacity-0 group-hover/gc:opacity-100 transition-opacity shrink-0">
                                      <Button size="sm" variant="ghost" class="h-5 w-5 p-0 text-muted-foreground hover:text-foreground" title="Editar" @click="startEditModule(grandchild)">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger as-child>
                                          <Button size="sm" variant="ghost" class="h-5 w-5 p-0 text-muted-foreground hover:text-destructive">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Eliminar submodulo</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Estas seguro de eliminar "{{ grandchild.name }}"? Esta accion no se puede deshacer.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction @click="handleDeleteModule(grandchild.id)">Eliminar</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </template>
                                </div>
                              </template>
                            </div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </template>
                </div>
              </CardContent>
            </Card>

            <!-- Statuses -->
            <Card>
              <CardContent class="p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold">Estados ({{ taskStatuses.length }})</p>
                  <Button size="sm" variant="outline" class="h-7 text-xs" @click="showStatusInput = !showStatusInput">
                    {{ showStatusInput ? 'Cancelar' : 'Agregar' }}
                  </Button>
                </div>
                <!-- Add status form -->
                <div v-if="showStatusInput" class="flex items-center gap-2 pb-3 border-b">
                  <input type="color" v-model="newStatusColor" class="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                  <Input v-model="newStatusName" placeholder="Nombre del estado" class="flex-1" @keyup.enter="handleCreateStatus" />
                  <Button size="sm" :disabled="!newStatusName.trim()" @click="handleCreateStatus">Crear</Button>
                </div>

                <div v-if="taskStatuses.length === 0 && !showStatusInput" class="text-muted-foreground text-xs">
                  Sin estados
                </div>
                <div v-for="status in taskStatuses" :key="status.id" class="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: status.color }" />
                    <span class="text-xs">{{ status.name }}</span>
                    <Badge v-if="status.isDefault" variant="outline" class="text-[10px] px-1 py-0">default</Badge>
                    <Badge v-if="status.isCompleted" variant="outline" class="text-[10px] px-1 py-0 border-green-500 text-green-500">completado</Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger as-child>
                      <Button size="sm" variant="ghost" class="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar estado</AlertDialogTitle>
                        <AlertDialogDescription>
                          Estas seguro de eliminar "{{ status.name }}"? Las tareas con este estado quedaran sin estado.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction @click="handleDeleteStatus(status.id)">Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <!-- Tab: Tasks -->
        <TabsContent value="tasks">
          <div class="space-y-3">
            <!-- Header -->
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">Tareas del proyecto ({{ projectTasks.length }})</p>
              <Button size="sm" class="h-7 text-xs" @click="router.push({ path: '/tasks', query: { projectId: currentProject.id } })">
                Nueva tarea
              </Button>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-3 flex-wrap">
              <div class="relative flex-1 min-w-[180px] max-w-xs">
                <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <Input v-model="taskSearch" placeholder="Buscar tareas..." class="pl-9 h-8" />
              </div>

              <div class="w-px h-6 bg-border" />

              <Select v-model="taskFilterStatus">
                <SelectTrigger class="w-[160px] h-8 text-sm">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem v-for="s in taskStatuses" :key="s.id" :value="s.id">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: s.color }" />
                      {{ s.name }}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div class="flex gap-1">
                <Button
                  v-for="p in [
                    { value: 'all', label: 'Todas' },
                    { value: 'urgent', label: 'Urgente' },
                    { value: 'high', label: 'Alta' },
                    { value: 'medium', label: 'Media' },
                    { value: 'low', label: 'Baja' },
                  ]"
                  :key="p.value"
                  size="sm"
                  class="h-7 text-xs"
                  :variant="taskFilterPriority === p.value ? 'default' : 'outline'"
                  @click="taskFilterPriority = taskFilterPriority === p.value && p.value !== 'all' ? 'all' : p.value"
                >
                  {{ p.label }}
                </Button>
              </div>

              <Button v-if="hasTaskFilters" size="sm" variant="ghost" class="h-7 text-xs text-muted-foreground" @click="clearTaskFilters">
                Limpiar
              </Button>
            </div>

            <!-- DataTable -->
            <DataTable
              :data="filteredProjectTasks"
              :columns="taskColumns"
              :loading="tasksLoading"
              :searchable="false"
              empty-message="No hay tareas en este proyecto"
              row-key="id"
              :row-clickable="true"
              @row-click="handleTaskRowClick"
            >
              <!-- Status dot -->
              <template #cell-status="{ row }">
                <div class="flex justify-center">
                  <div class="w-2.5 h-2.5 rounded-full" :class="getTaskStatusInfo(row.statusId)?.isCompleted ? 'bg-green-500' : 'bg-gray-400'" />
                </div>
              </template>

              <!-- Title -->
              <template #cell-title="{ row }">
                <span class="text-sm" :class="{ 'line-through text-muted-foreground': getTaskStatusInfo(row.statusId)?.isCompleted }">
                  {{ row.title }}
                </span>
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

              <!-- Assignees -->
              <template #cell-assignees="{ row }">
                <div v-if="row.assignees?.length" class="flex items-center gap-1.5">
                  <div class="flex -space-x-1.5">
                    <div
                      v-for="(a, i) in row.assignees.slice(0, 3)"
                      :key="a.id"
                      class="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[9px] font-semibold border-2 border-background"
                      :title="`${a.firstName} ${a.lastName}`"
                      :style="{ zIndex: 3 - i }"
                    >
                      {{ getAssigneeInitials(a) }}
                    </div>
                    <div
                      v-if="row.assignees.length > 3"
                      class="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] font-semibold border-2 border-background"
                    >
                      +{{ row.assignees.length - 3 }}
                    </div>
                  </div>
                  <span class="text-xs text-muted-foreground truncate max-w-[80px]">
                    {{ row.assignees[0].firstName }}{{ row.assignees.length > 1 ? ` +${row.assignees.length - 1}` : '' }}
                  </span>
                </div>
                <span v-else class="text-xs text-muted-foreground">—</span>
              </template>

              <!-- Priority -->
              <template #cell-priority="{ row }">
                <Badge v-if="row.priority" variant="outline" class="text-[10px]" :class="priorityColor[row.priority]">
                  {{ priorityLabel[row.priority] || row.priority }}
                </Badge>
              </template>

              <!-- Status -->
              <template #cell-statusName="{ row }">
                <div v-if="getTaskStatusInfo(row.statusId)" class="flex items-center justify-center gap-1.5">
                  <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: getTaskStatusInfo(row.statusId)!.color }" />
                  <span class="text-xs">{{ getTaskStatusInfo(row.statusId)!.name }}</span>
                </div>
                <span v-else class="text-xs text-muted-foreground">—</span>
              </template>

              <!-- Comments -->
              <template #cell-commentCount="{ row }">
                <div v-if="row.commentCount" class="flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                  <span class="text-xs">{{ row.commentCount }}</span>
                  <span v-if="row.hasUnreadComments" class="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <span v-else class="text-xs text-muted-foreground">—</span>
              </template>

              <!-- Subtasks -->
              <template #cell-subtaskCount="{ row }">
                <div v-if="row.subtaskCount" class="flex items-center justify-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
                  <span class="text-xs">{{ row.subtaskCount }}</span>
                </div>
                <span v-else class="text-xs text-muted-foreground">—</span>
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
                      <AlertDialogAction @click="handleDeleteTask(row)">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </template>
            </DataTable>
          </div>
        </TabsContent>

        <!-- Tab: Board (Kanban) -->
        <TabsContent value="board">
          <KanbanBoard
            :statuses="taskStatuses"
            :tasks="projectTasks"
            :loading="tasksLoading"
            :storage-key="slug"
            :project-id="currentProject?.id"
            @task-click="(task) => router.push(`/tasks/${task.id}`)"
            @bulk-update="handleBulkUpdate"
            @task-created="handleTaskCreatedFromBoard"
          />
        </TabsContent>

        <!-- Tab: Members -->
        <TabsContent value="members">
          <div class="space-y-3">
            <Card>
              <CardContent class="p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold">Miembros</p>
                  <Button v-if="currentProject.organizationId" size="sm" variant="outline" class="h-7 text-xs" @click="showMemberInput = !showMemberInput">
                    {{ showMemberInput ? 'Cancelar' : 'Invitar miembro' }}
                  </Button>
                </div>
                <!-- Invite by email form -->
                <div v-if="showMemberInput" class="flex items-center gap-2 pb-2 border-b">
                  <Input v-model="inviteEmail" type="email" placeholder="Email del usuario" class="flex-1 h-8" @keyup.enter="handleInvite" />
                  <div class="flex gap-1">
                    <Button
                      type="button" size="sm" class="h-8"
                      :variant="inviteRole === 'member' ? 'default' : 'outline'"
                      @click="inviteRole = 'member'"
                    >
                      Miembro
                    </Button>
                    <Button
                      type="button" size="sm" class="h-8"
                      :variant="inviteRole === 'admin' ? 'default' : 'outline'"
                      @click="inviteRole = 'admin'"
                    >
                      Admin
                    </Button>
                    <Button
                      type="button" size="sm" class="h-8"
                      :variant="inviteRole === 'viewer' ? 'default' : 'outline'"
                      @click="inviteRole = 'viewer'"
                    >
                      Viewer
                    </Button>
                  </div>
                  <Button size="sm" class="h-8" :disabled="!inviteEmail.trim() || inviting" @click="handleInvite">
                    {{ inviting ? 'Invitando...' : 'Invitar' }}
                  </Button>
                </div>

                <div v-if="projectMembers.length === 0" class="text-muted-foreground text-xs">Sin miembros</div>
                <div v-for="member in projectMembers" :key="member.id" class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                      {{ getMemberInitials(member) }}
                    </div>
                    <div>
                      <p class="text-sm font-medium leading-tight">{{ getMemberName(member) }}</p>
                      <p v-if="getMemberEmail(member)" class="text-[11px] text-muted-foreground">{{ getMemberEmail(member) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <Badge variant="outline" class="text-xs">{{ roleLabels[member.role] || member.role }}</Badge>
                    <AlertDialog v-if="member.role !== 'owner'">
                      <AlertDialogTrigger as-child>
                        <Button size="sm" variant="ghost" class="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar miembro</AlertDialogTitle>
                          <AlertDialogDescription>
                            Estas seguro de eliminar a {{ getMemberName(member) }} del proyecto?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction @click="handleRemoveMember(member.userId)">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Pending Invitations -->
            <Card v-if="currentProject.organizationId && projectInvitations.length > 0">
              <CardContent class="p-4 space-y-2">
                <p class="text-sm font-semibold">Invitaciones Pendientes ({{ projectInvitations.length }})</p>
                <div v-for="inv in projectInvitations" :key="inv.id" class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                      {{ inv.email.slice(0, 2).toUpperCase() }}
                    </div>
                    <div>
                      <p class="text-xs font-medium">{{ inv.email }}</p>
                      <p class="text-[11px] text-muted-foreground">Pendiente</p>
                    </div>
                  </div>
                  <Badge variant="secondary" class="text-xs">{{ roleLabels[inv.projectRole || 'member'] || inv.projectRole }}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </template>
  </div>
</template>
