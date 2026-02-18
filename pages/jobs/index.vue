<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { JobExecution, JobExecutionStatus } from '~/modules/jobs/types'
import type { ColumnDef } from '~/components/shared/DataTable/types'
import { useJobs } from '~/modules/jobs/composables/useJobs'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
  ClockIcon,
  PlayIcon,
  Trash2Icon,
  EyeIcon,
  XIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  AlertCircleIcon,
  RefreshCwIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const {
  executions,
  jobStatuses,
  loading,
  error,
  total,
  page,
  limit,
  fetchExecutions,
  fetchStatus,
  triggerJob,
  cleanupExecutions,
  clearError,
} = useJobs()

// Filtros
const jobNameFilter = ref<string>('all')
const statusFilter = ref<string>('all')

// Trigger job
const selectedJobName = ref('')
const triggerData = ref('')
const triggerLoading = ref(false)
const triggerSuccess = ref<string | null>(null)

// Cleanup dialog
const showCleanupDialog = ref(false)
const cleanupLoading = ref(false)

// Detail dialog
const showDetailDialog = ref(false)
const selectedExecution = ref<JobExecution | null>(null)

// Columnas de la tabla
const columns: ColumnDef<JobExecution>[] = [
  { key: 'jobName', label: 'Job', sortable: false },
  { key: 'status', label: 'Estado', sortable: false, align: 'center', width: '130px' },
  { key: 'startedAt', label: 'Iniciado', sortable: false },
  { key: 'duration', label: 'Duracion', sortable: false, align: 'center', width: '120px' },
  { key: 'actions', label: 'Acciones', sortable: false, align: 'center', width: '80px' },
]

// Job names disponibles desde los statuses cargados
const availableJobNames = computed(() => {
  return jobStatuses.value.map((s) => s.name)
})

// ========================
// Carga inicial
// ========================

onMounted(async () => {
  await Promise.all([loadExecutions(), fetchStatus()])
})

const loadExecutions = async () => {
  try {
    await fetchExecutions({
      page: page.value,
      limit: limit.value,
      jobName: jobNameFilter.value !== 'all' ? jobNameFilter.value : undefined,
      status: statusFilter.value !== 'all' ? (statusFilter.value as JobExecutionStatus) : undefined,
    })
  } catch (e) {
    console.error('Error loading executions:', e)
  }
}

// ========================
// Handlers
// ========================

const handleFilterChange = async () => {
  page.value = 1
  await loadExecutions()
}

const handlePageChange = async (newPage: number) => {
  page.value = newPage
  await loadExecutions()
}

const handleTriggerJob = async () => {
  if (!selectedJobName.value) return

  triggerLoading.value = true
  triggerSuccess.value = null

  try {
    let parsedData: Record<string, any> | undefined
    if (triggerData.value.trim()) {
      try {
        parsedData = JSON.parse(triggerData.value)
      } catch {
        error.value = 'JSON invalido en los datos del job'
        triggerLoading.value = false
        return
      }
    }

    await triggerJob({
      jobName: selectedJobName.value,
      data: parsedData,
    })

    triggerSuccess.value = `Job "${selectedJobName.value}" disparado exitosamente`
    triggerData.value = ''

    // Recargar datos
    await Promise.all([loadExecutions(), fetchStatus()])

    setTimeout(() => {
      triggerSuccess.value = null
    }, 4000)
  } catch (e) {
    console.error('Error triggering job:', e)
  } finally {
    triggerLoading.value = false
  }
}

const handleCleanup = async () => {
  cleanupLoading.value = true
  try {
    await cleanupExecutions()
    showCleanupDialog.value = false
    await loadExecutions()
  } catch (e) {
    console.error('Error cleaning up:', e)
  } finally {
    cleanupLoading.value = false
  }
}

const viewExecution = (execution: JobExecution) => {
  selectedExecution.value = execution
  showDetailDialog.value = true
}

const handleRefresh = async () => {
  await Promise.all([loadExecutions(), fetchStatus()])
}

// ========================
// Helpers de formato
// ========================

const getStatusText = (status: JobExecutionStatus) => {
  const statuses: Record<JobExecutionStatus, string> = {
    pending: 'Pendiente',
    running: 'Ejecutando',
    completed: 'Completado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
  }
  return statuses[status] || status
}

const getStatusClass = (status: JobExecutionStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    case 'running':
      return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse'
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'cancelled':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    default:
      return ''
  }
}

const getStatusVariant = (status: JobExecutionStatus) => {
  switch (status) {
    case 'pending':
      return 'secondary' as const
    case 'running':
      return 'default' as const
    case 'completed':
      return 'default' as const
    case 'failed':
      return 'destructive' as const
    case 'cancelled':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDuration = (ms?: number) => {
  if (ms === undefined || ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(0)
  return `${minutes}m ${seconds}s`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Background Jobs</h1>
        <p class="text-xs text-muted-foreground">Gestiona y monitorea los jobs programados del sistema</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="handleRefresh">
          <RefreshCwIcon class="h-4 w-4 mr-2" />
          Refrescar
        </Button>
        <Button variant="destructive" size="sm" @click="showCleanupDialog = true">
          <Trash2Icon class="h-4 w-4 mr-2" />
          Limpiar antiguas
        </Button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError">
          <XIcon class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Success message -->
    <div v-if="triggerSuccess" class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
      <div class="flex items-center gap-2">
        <CheckCircleIcon class="h-4 w-4" />
        <p>{{ triggerSuccess }}</p>
      </div>
    </div>

    <!-- Job Status Cards -->
    <div>
      <h2 class="text-sm font-medium text-muted-foreground mb-3">Estado de Jobs</h2>
      <div v-if="jobStatuses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card v-for="job in jobStatuses" :key="job.name" class="relative">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-sm font-medium">{{ job.name }}</CardTitle>
              <div class="flex items-center gap-1.5">
                <span
                  class="h-2.5 w-2.5 rounded-full"
                  :class="job.isRunning ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'"
                />
                <span class="text-xs" :class="job.isRunning ? 'text-blue-600 font-medium' : 'text-muted-foreground'">
                  {{ job.isRunning ? 'Ejecutando' : 'Inactivo' }}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-2">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-muted-foreground">Total ejecuciones</span>
                <p class="font-semibold">{{ job.totalExecutions }}</p>
              </div>
              <div>
                <span class="text-muted-foreground">Fallidas</span>
                <p class="font-semibold" :class="job.failedExecutions > 0 ? 'text-red-600' : ''">
                  {{ job.failedExecutions }}
                </p>
              </div>
            </div>
            <div v-if="job.lastExecution" class="text-xs">
              <span class="text-muted-foreground">Ultima ejecucion:</span>
              <p>
                <Badge
                  :variant="getStatusVariant(job.lastExecution.status)"
                  :class="['text-[10px] mr-1', getStatusClass(job.lastExecution.status)]"
                >
                  {{ getStatusText(job.lastExecution.status) }}
                </Badge>
                <span class="text-muted-foreground">{{ formatDate(job.lastExecution.startedAt) }}</span>
              </p>
            </div>
            <div v-if="job.nextScheduledRun" class="text-xs">
              <span class="text-muted-foreground">Proxima ejecucion:</span>
              <p class="text-muted-foreground">{{ formatDate(job.nextScheduledRun) }}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div v-else-if="!loading" class="bg-card rounded-lg border p-6 text-center text-sm text-muted-foreground">
        No se encontraron jobs registrados
      </div>
    </div>

    <!-- Trigger Job Section -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-sm font-medium flex items-center gap-2">
          <PlayIcon class="h-4 w-4" />
          Disparar Job
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">Nombre del job</label>
            <Select v-model="selectedJobName">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar job..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="name in availableJobNames" :key="name" :value="name">
                  {{ name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label class="text-xs text-muted-foreground mb-1 block">Datos (JSON, opcional)</label>
            <Textarea
              v-model="triggerData"
              placeholder='{"key": "value"}'
              class="h-[38px] min-h-[38px] resize-none font-mono text-xs"
            />
          </div>
          <div class="flex items-end">
            <Button
              class="w-full"
              :disabled="!selectedJobName || triggerLoading"
              @click="handleTriggerJob"
            >
              <LoaderIcon v-if="triggerLoading" class="h-4 w-4 mr-2 animate-spin" />
              <PlayIcon v-else class="h-4 w-4 mr-2" />
              Disparar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Filters -->
    <div class="bg-card rounded-lg border p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Select v-model="jobNameFilter" @update:model-value="handleFilterChange">
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los jobs</SelectItem>
              <SelectItem v-for="name in availableJobNames" :key="name" :value="name">
                {{ name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select v-model="statusFilter" @update:model-value="handleFilterChange">
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="running">Ejecutando</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button variant="outline" class="w-full" @click="handleFilterChange">
            <RefreshCwIcon class="h-4 w-4 mr-2" />
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>

    <!-- Executions Table -->
    <DataTable
      :data="executions"
      :columns="columns"
      :loading="loading"
      :pagination="{ page, pageSize: limit, total }"
      empty-message="No se encontraron ejecuciones"
      row-key="id"
      @page-change="handlePageChange"
    >
      <template #cell-jobName="{ row }">
        <div class="flex items-center gap-2">
          <ClockIcon class="h-4 w-4 text-muted-foreground" />
          <span class="font-medium text-sm">{{ row.jobName }}</span>
        </div>
      </template>

      <template #cell-status="{ row }">
        <Badge
          :variant="getStatusVariant(row.status)"
          :class="['text-xs', getStatusClass(row.status)]"
        >
          {{ getStatusText(row.status) }}
        </Badge>
      </template>

      <template #cell-startedAt="{ row }">
        <span class="text-sm">{{ formatDate(row.startedAt) }}</span>
      </template>

      <template #cell-duration="{ row }">
        <span class="text-sm font-mono">{{ formatDuration(row.duration) }}</span>
      </template>

      <template #cell-actions="{ row }">
        <Button
          variant="ghost"
          size="sm"
          title="Ver detalle"
          @click="viewExecution(row)"
        >
          <EyeIcon class="h-4 w-4" />
        </Button>
      </template>
    </DataTable>

    <!-- Cleanup Confirmation Dialog -->
    <AlertDialog v-model:open="showCleanupDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpiar ejecuciones antiguas</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion eliminara todas las ejecuciones antiguas del sistema.
            Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="cleanupLoading">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="cleanupLoading"
            @click.prevent="handleCleanup"
          >
            <LoaderIcon v-if="cleanupLoading" class="h-4 w-4 mr-2 animate-spin" />
            Limpiar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Execution Detail Dialog -->
    <AlertDialog v-model:open="showDetailDialog">
      <AlertDialogContent class="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Detalle de ejecucion</AlertDialogTitle>
          <AlertDialogDescription v-if="selectedExecution">
            {{ selectedExecution.jobName }} - {{ selectedExecution.id }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div v-if="selectedExecution" class="space-y-3 py-2">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-muted-foreground text-xs">Estado</span>
              <div class="mt-1">
                <Badge
                  :variant="getStatusVariant(selectedExecution.status)"
                  :class="['text-xs', getStatusClass(selectedExecution.status)]"
                >
                  {{ getStatusText(selectedExecution.status) }}
                </Badge>
              </div>
            </div>
            <div>
              <span class="text-muted-foreground text-xs">Duracion</span>
              <p class="font-mono mt-1">{{ formatDuration(selectedExecution.duration) }}</p>
            </div>
            <div>
              <span class="text-muted-foreground text-xs">Iniciado</span>
              <p class="mt-1">{{ formatDate(selectedExecution.startedAt) }}</p>
            </div>
            <div>
              <span class="text-muted-foreground text-xs">Completado</span>
              <p class="mt-1">{{ formatDate(selectedExecution.completedAt) }}</p>
            </div>
          </div>

          <div v-if="selectedExecution.error">
            <span class="text-muted-foreground text-xs">Error</span>
            <pre class="mt-1 bg-red-50 border border-red-200 text-red-800 rounded p-2 text-xs overflow-auto max-h-32">{{ selectedExecution.error }}</pre>
          </div>

          <div v-if="selectedExecution.data">
            <span class="text-muted-foreground text-xs">Datos de entrada</span>
            <pre class="mt-1 bg-muted rounded p-2 text-xs overflow-auto max-h-32">{{ JSON.stringify(selectedExecution.data, null, 2) }}</pre>
          </div>

          <div v-if="selectedExecution.result">
            <span class="text-muted-foreground text-xs">Resultado</span>
            <pre class="mt-1 bg-muted rounded p-2 text-xs overflow-auto max-h-32">{{ JSON.stringify(selectedExecution.result, null, 2) }}</pre>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cerrar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
