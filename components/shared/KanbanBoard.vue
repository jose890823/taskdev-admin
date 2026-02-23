<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, nextTick } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import type { TaskStatus } from '~/modules/projects/types'
import type { Task, TaskAssignee, BulkPositionItem } from '~/modules/tasks/types'
import { useTasks } from '~/modules/tasks/composables/useTasks'

const props = defineProps<{
  statuses: TaskStatus[]
  tasks: Task[]
  loading?: boolean
  storageKey?: string
  projectId?: string
}>()

const emit = defineEmits<{
  'task-click': [task: Task]
  'bulk-update': [items: BulkPositionItem[]]
  'task-created': [task: Task]
}>()

interface Column {
  status: TaskStatus
  tasks: Task[]
}

interface ColumnFilter {
  assigneeIds: string[]
  priorities: string[]
  dateFrom: string
  dateTo: string
}

// ── Per-column filters ──
const columnFilters = reactive<Record<string, ColumnFilter>>({})

const getFilter = (statusId: string): ColumnFilter => {
  if (!columnFilters[statusId]) {
    columnFilters[statusId] = { assigneeIds: [], priorities: [], dateFrom: '', dateTo: '' }
  }
  return columnFilters[statusId]
}

const toggleAssigneeFilter = (statusId: string, assigneeId: string) => {
  const filter = getFilter(statusId)
  const idx = filter.assigneeIds.indexOf(assigneeId)
  if (idx >= 0) filter.assigneeIds.splice(idx, 1)
  else filter.assigneeIds.push(assigneeId)
}

const togglePriorityFilter = (statusId: string, priority: string) => {
  const filter = getFilter(statusId)
  const idx = filter.priorities.indexOf(priority)
  if (idx >= 0) filter.priorities.splice(idx, 1)
  else filter.priorities.push(priority)
}

const clearColumnFilter = (statusId: string) => {
  columnFilters[statusId] = { assigneeIds: [], priorities: [], dateFrom: '', dateTo: '' }
}

// ── localStorage persistence ──
const filtersStorageKey = computed(() =>
  props.storageKey ? `kanban-filters-${props.storageKey}` : null
)

let skipSave = false

const saveFilters = () => {
  if (!filtersStorageKey.value || skipSave) return
  const toSave: Record<string, ColumnFilter> = {}
  for (const [statusId, filter] of Object.entries(columnFilters)) {
    if (filter.assigneeIds.length || filter.priorities.length || filter.dateFrom || filter.dateTo) {
      toSave[statusId] = filter
    }
  }
  if (Object.keys(toSave).length > 0) {
    localStorage.setItem(filtersStorageKey.value, JSON.stringify(toSave))
  } else {
    localStorage.removeItem(filtersStorageKey.value)
  }
}

const loadFilters = () => {
  if (!filtersStorageKey.value) return
  try {
    const raw = localStorage.getItem(filtersStorageKey.value)
    if (!raw) return
    const saved = JSON.parse(raw) as Record<string, ColumnFilter>
    skipSave = true
    for (const [statusId, filter] of Object.entries(saved)) {
      columnFilters[statusId] = { ...filter }
    }
    skipSave = false
  } catch {
    // ignore invalid data
  }
}

// Auto-save on any filter change
watch(columnFilters, saveFilters, { deep: true })

onMounted(loadFilters)

const columnFilterCount = (statusId: string): number => {
  const f = columnFilters[statusId]
  if (!f) return 0
  let count = 0
  if (f.assigneeIds.length) count++
  if (f.priorities.length) count++
  if (f.dateFrom || f.dateTo) count++
  return count
}

const getColumnAssignees = (statusId: string): TaskAssignee[] => {
  const map = new Map<string, TaskAssignee>()
  for (const task of props.tasks || []) {
    if (task.statusId !== statusId) continue
    const assignees = getTaskAssignees(task)
    for (const a of assignees) {
      if (!map.has(a.id)) map.set(a.id, a)
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    getAssigneeName(a).localeCompare(getAssigneeName(b))
  )
}

const applyColumnFilter = (tasks: Task[], statusId: string): Task[] => {
  const f = columnFilters[statusId]
  if (!f) return tasks

  let result = tasks

  if (f.assigneeIds.length > 0) {
    result = result.filter(t => {
      const assignees = getTaskAssignees(t)
      return assignees.some(a => f.assigneeIds.includes(a.id))
    })
  }

  if (f.priorities.length > 0) {
    result = result.filter(t => f.priorities.includes(t.priority))
  }

  if (f.dateFrom) {
    const from = new Date(f.dateFrom)
    from.setHours(0, 0, 0, 0)
    result = result.filter(t => {
      if (!t.dueDate) return false
      return new Date(t.dueDate) >= from
    })
  }

  if (f.dateTo) {
    const to = new Date(f.dateTo)
    to.setHours(23, 59, 59, 999)
    result = result.filter(t => {
      if (!t.dueDate) return false
      return new Date(t.dueDate) <= to
    })
  }

  return result
}

// ── Columns ──
const columns = ref<Column[]>([])

const buildColumns = () => {
  if (!props.statuses?.length) {
    columns.value = []
    return
  }
  const allTasks = props.tasks || []
  const sorted = [...props.statuses].sort((a, b) => a.position - b.position)
  columns.value = sorted.map(status => {
    const statusTasks = allTasks
      .filter(t => t.statusId === status.id)
      .sort((a, b) => a.position - b.position)
    return {
      status,
      tasks: applyColumnFilter(statusTasks, status.id),
    }
  })
}

watch(
  () => [props.statuses, props.tasks, columnFilters],
  buildColumns,
  { immediate: true, deep: true },
)

// Raw count per column (before filters)
const rawColumnCount = (statusId: string): number => {
  return (props.tasks || []).filter(t => t.statusId === statusId).length
}

const totalTasks = computed(() => (props.tasks || []).length)

const priorityConfig: Record<string, { label: string; class: string }> = {
  urgent: { label: 'Urgente', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  high: { label: 'Alta', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  medium: { label: 'Media', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  low: { label: 'Baja', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const formatDate = (date: string | null | undefined) => {
  if (!date) return null
  return new Date(date).toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

const isOverdue = (date: string | null | undefined) => {
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(date) < today
}

const getTaskAssignees = (task: Task): TaskAssignee[] => {
  if (task.assignees && task.assignees.length > 0) return task.assignees
  if (task.assignedTo) return [task.assignedTo]
  return []
}

const getInitials = (assignee: TaskAssignee) => {
  const f = assignee.firstName?.[0] || ''
  const l = assignee.lastName?.[0] || ''
  return (f + l).toUpperCase() || assignee.email[0].toUpperCase()
}

const getAssigneeName = (assignee: TaskAssignee) => {
  const { firstName, lastName } = assignee
  if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim()
  return assignee.email
}

const getAssigneeNames = (task: Task): string => {
  const assignees = getTaskAssignees(task)
  if (assignees.length === 0) return ''
  const names = assignees.map(a => getAssigneeName(a))
  if (names.length <= 2) return names.join(', ')
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

const MAX_VISIBLE_AVATARS = 3

// ── Inline task creation ──
const inlineAdd = reactive<Record<string, { active: boolean; title: string; saving: boolean }>>({})

const getInlineAdd = (statusId: string) => {
  if (!inlineAdd[statusId]) {
    inlineAdd[statusId] = { active: false, title: '', saving: false }
  }
  return inlineAdd[statusId]
}

const startInlineAdd = (statusId: string) => {
  const state = getInlineAdd(statusId)
  state.active = true
  state.title = ''
  nextTick(() => {
    const input = document.querySelector(`[data-inline-input="${statusId}"]`) as HTMLInputElement
    input?.focus()
  })
}

const cancelInlineAdd = (statusId: string) => {
  const state = getInlineAdd(statusId)
  state.active = false
  state.title = ''
}

const submitInlineAdd = async (statusId: string) => {
  const state = getInlineAdd(statusId)
  if (!state.title.trim() || state.saving) return

  state.saving = true
  try {
    const { create } = useTasks()
    const task = await create({
      title: state.title.trim(),
      projectId: props.projectId,
      statusId,
    })
    if (task) {
      state.active = false
      state.title = ''
      emit('task-created', task)
    }
  } finally {
    state.saving = false
  }
}

const handleDragEnd = () => {
  const updates: BulkPositionItem[] = []

  for (const col of columns.value) {
    for (let i = 0; i < col.tasks.length; i++) {
      const task = col.tasks[i]
      const positionChanged = task.position !== i
      const statusChanged = task.statusId !== col.status.id

      if (positionChanged || statusChanged) {
        updates.push({
          id: task.id,
          position: i,
          ...(statusChanged ? { statusId: col.status.id } : {}),
        })
        task.position = i
        if (statusChanged) task.statusId = col.status.id
      }
    }
  }

  if (updates.length > 0) {
    emit('bulk-update', updates)
  }
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-20 text-muted-foreground">
    Cargando tablero...
  </div>

  <div v-else-if="statuses.length === 0" class="text-center py-12 text-muted-foreground">
    Este proyecto no tiene estados configurados
  </div>

  <div v-else class="flex gap-3 overflow-x-auto pb-4 h-[calc(100vh-180px)]">
    <div
      v-for="col in columns"
      :key="col.status.id"
      class="kanban-column flex-1 min-w-[250px] flex flex-col bg-muted/40 rounded-lg"
      :style="{ '--col-color': col.status.color }"
    >
      <!-- Column header -->
      <div class="flex items-center gap-2 px-3 py-3 border-b">
        <div
          class="w-2.5 h-2.5 rounded-full flex-shrink-0"
          :style="{ backgroundColor: col.status.color }"
        />
        <span class="text-sm font-medium truncate">{{ col.status.name }}</span>

        <!-- Per-column filter button -->
        <Popover>
          <PopoverTrigger as-child>
            <button
              class="ml-auto flex items-center justify-center w-6 h-6 rounded hover:bg-muted/80 transition-colors relative"
              :class="columnFilterCount(col.status.id) > 0 ? 'text-primary' : 'text-muted-foreground'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              <span
                v-if="columnFilterCount(col.status.id) > 0"
                class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-bold"
              >
                {{ columnFilterCount(col.status.id) }}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent class="w-[420px] p-0" align="start" side="bottom">
            <!-- Header -->
            <div class="flex items-center justify-between px-3 py-2 border-b">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: col.status.color }" />
                <p class="text-xs font-semibold">{{ col.status.name }}</p>
                <span class="text-[10px] text-muted-foreground">{{ col.tasks.length }}/{{ rawColumnCount(col.status.id) }}</span>
              </div>
              <Button
                v-if="columnFilterCount(col.status.id) > 0"
                variant="ghost"
                size="sm"
                class="h-5 text-[10px] px-1.5 text-muted-foreground"
                @click="clearColumnFilter(col.status.id)"
              >
                Limpiar
              </Button>
            </div>

            <div class="p-3 space-y-3">
              <!-- Priority: horizontal toggle badges -->
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-16">Prioridad</span>
                <div class="flex gap-1.5 flex-wrap">
                  <button
                    v-for="(config, key) in priorityConfig"
                    :key="key"
                    class="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border"
                    :class="getFilter(col.status.id).priorities.includes(String(key))
                      ? config.class + ' border-transparent ring-1 ring-offset-1 ring-current'
                      : 'border-border text-muted-foreground hover:border-foreground/30'"
                    @click="togglePriorityFilter(col.status.id, String(key))"
                  >
                    {{ config.label }}
                  </button>
                </div>
              </div>

              <!-- Assignees: clickable avatar chips -->
              <div class="flex items-start gap-2">
                <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-16 mt-1">Asignado</span>
                <div v-if="getColumnAssignees(col.status.id).length === 0" class="text-[10px] text-muted-foreground mt-0.5">Sin asignados</div>
                <div v-else class="flex gap-1.5 flex-wrap">
                  <button
                    v-for="assignee in getColumnAssignees(col.status.id)"
                    :key="assignee.id"
                    class="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all border"
                    :class="getFilter(col.status.id).assigneeIds.includes(assignee.id)
                      ? 'bg-primary/15 text-primary border-primary/30 ring-1 ring-offset-1 ring-primary/30'
                      : 'border-border text-muted-foreground hover:border-foreground/30'"
                    :title="getAssigneeName(assignee)"
                    @click="toggleAssigneeFilter(col.status.id, assignee.id)"
                  >
                    <span class="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[7px] font-bold shrink-0">
                      {{ getInitials(assignee) }}
                    </span>
                    <span class="max-w-[60px] truncate">{{ assignee.firstName || assignee.email.split('@')[0] }}</span>
                  </button>
                </div>
              </div>

              <!-- Date range: horizontal -->
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-16">Fechas</span>
                <div class="flex items-center gap-1.5">
                  <Input v-model="getFilter(col.status.id).dateFrom" type="date" class="h-7 text-xs w-[130px]" />
                  <span class="text-[10px] text-muted-foreground">—</span>
                  <Input v-model="getFilter(col.status.id).dateTo" type="date" class="h-7 text-xs w-[130px]" />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Badge variant="secondary" class="text-xs h-5 min-w-[1.25rem] justify-center">
          {{ col.tasks.length }}
        </Badge>

        <!-- Add task button -->
        <button
          v-if="projectId"
          class="flex items-center justify-center w-6 h-6 rounded hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
          title="Agregar tarea"
          @click="startInlineAdd(col.status.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </button>
      </div>

      <!-- Inline add task -->
      <div v-if="getInlineAdd(col.status.id).active" class="px-2 pt-2">
        <div
          class="border rounded-lg p-3 border-l-[3px] border-dashed"
          :style="{ borderLeftColor: col.status.color }"
        >
          <input
            :data-inline-input="col.status.id"
            :value="getInlineAdd(col.status.id).title"
            @input="(e) => getInlineAdd(col.status.id).title = (e.target as HTMLInputElement).value"
            placeholder="Titulo de la tarea..."
            class="w-full text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/60"
            :disabled="getInlineAdd(col.status.id).saving"
            @keyup.enter="submitInlineAdd(col.status.id)"
            @keyup.escape="cancelInlineAdd(col.status.id)"
          />
          <div class="flex items-center justify-end gap-1 mt-2">
            <Button
              size="sm"
              variant="ghost"
              class="h-6 text-xs px-2"
              :disabled="getInlineAdd(col.status.id).saving"
              @click="cancelInlineAdd(col.status.id)"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              class="h-6 text-xs px-2"
              :disabled="!getInlineAdd(col.status.id).title.trim() || getInlineAdd(col.status.id).saving"
              @click="submitInlineAdd(col.status.id)"
            >
              {{ getInlineAdd(col.status.id).saving ? 'Creando...' : 'Crear' }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Draggable area -->
      <VueDraggable
        v-model="col.tasks"
        group="kanban"
        :animation="200"
        ghost-class="opacity-30"
        drag-class="rotate-2"
        class="kanban-scroll flex-1 p-2 space-y-2 min-h-[60px] overflow-y-auto"
        @end="handleDragEnd"
      >
        <div
          v-for="task in col.tasks"
          :key="task.id"
          class="border rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-all border-l-[3px]"
          :style="{
            backgroundColor: col.status.color + '18',
            borderLeftColor: col.status.color,
          }"
          @click="emit('task-click', task)"
        >
          <div class="flex items-start justify-between gap-1 mb-2">
            <p class="text-sm font-medium leading-snug">{{ task.title }}</p>
            <span v-if="task.systemCode" class="text-[9px] text-muted-foreground font-mono shrink-0 mt-0.5">{{ task.systemCode }}</span>
          </div>

          <!-- Assignee names (truncated) -->
          <p v-if="getAssigneeNames(task)" class="text-[10px] text-muted-foreground mb-1.5 truncate">
            {{ getAssigneeNames(task) }}
          </p>

          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-wrap">
              <Badge
                v-if="task.priority"
                variant="secondary"
                class="text-[10px] px-1.5 py-0"
                :class="priorityConfig[task.priority]?.class"
              >
                {{ priorityConfig[task.priority]?.label || task.priority }}
              </Badge>
              <span v-if="formatDate(task.scheduledDate)" class="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground" title="Fecha programada">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                {{ formatDate(task.scheduledDate) }}
              </span>
              <span v-if="formatDate(task.dueDate)" class="inline-flex items-center gap-0.5 text-[10px]" :class="isOverdue(task.dueDate) ? 'text-red-400' : 'text-muted-foreground'" :title="isOverdue(task.dueDate) ? 'Vencida' : 'Fecha limite'">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                {{ formatDate(task.dueDate) }}
              </span>
              <!-- Subtask indicator -->
              <span
                v-if="task.subtaskCount && task.subtaskCount > 0"
                class="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"
                title="Subtareas"
              >
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                {{ task.subtaskCount }}
              </span>
              <!-- Comment indicator -->
              <span
                v-if="task.commentCount && task.commentCount > 0"
                class="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground relative"
                title="Comentarios"
              >
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                {{ task.commentCount }}
                <span
                  v-if="task.hasUnreadComments"
                  class="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
                />
              </span>
            </div>

            <!-- Stacked avatars -->
            <div v-if="getTaskAssignees(task).length > 0" class="flex -space-x-1.5 flex-shrink-0">
              <div
                v-for="(assignee, idx) in getTaskAssignees(task).slice(0, MAX_VISIBLE_AVATARS)"
                :key="assignee.id"
                class="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-semibold ring-1 ring-background"
                :title="getAssigneeName(assignee)"
                :style="{ zIndex: MAX_VISIBLE_AVATARS - idx }"
              >
                {{ getInitials(assignee) }}
              </div>
              <div
                v-if="getTaskAssignees(task).length > MAX_VISIBLE_AVATARS"
                class="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] font-semibold ring-1 ring-background"
                :title="`${getTaskAssignees(task).length - MAX_VISIBLE_AVATARS} mas`"
              >
                +{{ getTaskAssignees(task).length - MAX_VISIBLE_AVATARS }}
              </div>
            </div>
          </div>
        </div>
      </VueDraggable>
    </div>
  </div>
</template>

<style scoped>
.kanban-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--col-color) transparent;
}

.kanban-scroll::-webkit-scrollbar {
  width: 4px;
}

.kanban-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.kanban-scroll::-webkit-scrollbar-thumb {
  background-color: var(--col-color);
  border-radius: 9999px;
}

.kanban-scroll::-webkit-scrollbar-thumb:hover {
  opacity: 0.8;
}
</style>
