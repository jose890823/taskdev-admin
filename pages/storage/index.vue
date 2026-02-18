<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { StorageProviderType, StorageConfig } from '~/modules/storage/types'
import { useStorageAdmin } from '~/modules/storage/composables/useStorageAdmin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
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
  HardDriveIcon,
  CloudIcon,
  DatabaseIcon,
  ImageIcon,
  FolderIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  Loader2Icon,
  SettingsIcon,
  ZapIcon,
  XIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const {
  providers,
  activeProvider,
  stats,
  loading,
  error,
  fetchProviders,
  updateProviderConfig,
  testProvider,
  activateProvider,
  fetchStats,
  clearError,
} = useStorageAdmin()

// Config dialog
const showConfigDialog = ref(false)
const editingProvider = ref<StorageConfig | null>(null)
const configForm = ref<Record<string, any>>({})
const saving = ref(false)

// Test
const testing = ref<string | null>(null)
const testResult = ref<{ success: boolean; message: string } | null>(null)

// Activate
const showActivateDialog = ref(false)
const providerToActivate = ref<StorageProviderType | null>(null)
const activating = ref(false)

onMounted(async () => {
  await Promise.all([fetchProviders(), fetchStats()])
})

const getProviderIcon = (type: StorageProviderType) => {
  const icons: Record<string, any> = {
    local: FolderIcon,
    s3: CloudIcon,
    gcs: DatabaseIcon,
    cloudinary: ImageIcon,
  }
  return icons[type] || HardDriveIcon
}

const getProviderLabel = (type: StorageProviderType) => {
  const labels: Record<string, string> = {
    local: 'Almacenamiento Local',
    s3: 'Amazon S3',
    gcs: 'Google Cloud Storage',
    cloudinary: 'Cloudinary',
  }
  return labels[type] || type
}

const getProviderDescription = (type: StorageProviderType) => {
  const descs: Record<string, string> = {
    local: 'Sistema de archivos del servidor',
    s3: 'Amazon S3 y servicios compatibles (MinIO, DigitalOcean)',
    gcs: 'Google Cloud Storage para archivos',
    cloudinary: 'Optimizado para imágenes y video',
  }
  return descs[type] || ''
}

const getConfigFields = (type: StorageProviderType): { key: string; label: string; type: string; required: boolean }[] => {
  switch (type) {
    case 'local':
      return [
        { key: 'basePath', label: 'Ruta base', type: 'text', required: true },
        { key: 'baseUrl', label: 'URL base', type: 'text', required: true },
      ]
    case 's3':
      return [
        { key: 'bucket', label: 'Bucket', type: 'text', required: true },
        { key: 'region', label: 'Región', type: 'text', required: true },
        { key: 'accessKeyId', label: 'Access Key ID', type: 'password', required: true },
        { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
        { key: 'endpoint', label: 'Endpoint (opcional)', type: 'text', required: false },
      ]
    case 'gcs':
      return [
        { key: 'projectId', label: 'Project ID', type: 'text', required: true },
        { key: 'bucket', label: 'Bucket', type: 'text', required: true },
        { key: 'keyFilename', label: 'Key Filename (opcional)', type: 'text', required: false },
      ]
    case 'cloudinary':
      return [
        { key: 'cloudName', label: 'Cloud Name', type: 'text', required: true },
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
        { key: 'folder', label: 'Carpeta (opcional)', type: 'text', required: false },
      ]
    default:
      return []
  }
}

const openConfigDialog = (provider: StorageConfig) => {
  editingProvider.value = provider
  configForm.value = { ...provider.config }
  showConfigDialog.value = true
}

const handleSaveConfig = async () => {
  if (!editingProvider.value) return
  saving.value = true
  try {
    await updateProviderConfig(editingProvider.value.provider, { config: configForm.value })
    showConfigDialog.value = false
  } catch (e) {
    console.error('Error saving config:', e)
  } finally {
    saving.value = false
  }
}

const handleTest = async (provider: StorageProviderType) => {
  testing.value = provider
  testResult.value = null
  try {
    const result = await testProvider(provider)
    testResult.value = result
  } catch (e: any) {
    testResult.value = { success: false, message: e.data?.message || 'Error al probar conexión' }
  } finally {
    testing.value = null
  }
}

const confirmActivate = (provider: StorageProviderType) => {
  providerToActivate.value = provider
  showActivateDialog.value = true
}

const handleActivate = async () => {
  if (!providerToActivate.value) return
  activating.value = true
  try {
    await activateProvider(providerToActivate.value)
    showActivateDialog.value = false
    await fetchStats()
  } catch (e) {
    console.error('Error activating provider:', e)
  } finally {
    activating.value = false
  }
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Almacenamiento</h1>
        <p class="text-xs text-muted-foreground">Configura los proveedores de almacenamiento</p>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError"><XIcon class="h-4 w-4" /></Button>
      </div>
    </div>

    <!-- Stats -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Proveedor activo</CardTitle>
          <HardDriveIcon class="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.activeProvider ? getProviderLabel(stats.activeProvider) : 'Ninguno' }}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Uso</CardTitle>
          <DatabaseIcon class="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatBytes(stats.usage.used) }}</div>
          <p v-if="stats.usage.total" class="text-xs text-muted-foreground">
            de {{ formatBytes(stats.usage.total) }}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Estado</CardTitle>
          <component :is="stats.isHealthy ? CheckCircleIcon : XCircleIcon" class="h-4 w-4" :class="stats.isHealthy ? 'text-green-500' : 'text-red-500'" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold" :class="stats.isHealthy ? 'text-green-600' : 'text-red-600'">
            {{ stats.isHealthy ? 'Saludable' : 'Con problemas' }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Loading -->
    <div v-if="loading && providers.length === 0" class="flex items-center justify-center py-12">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Provider Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card v-for="provider in providers" :key="provider.provider" :class="provider.isActive ? 'border-green-500 border-2' : ''">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <component :is="getProviderIcon(provider.provider)" class="h-6 w-6" :class="provider.isActive ? 'text-green-600' : 'text-muted-foreground'" />
              <div>
                <CardTitle class="text-lg">{{ getProviderLabel(provider.provider) }}</CardTitle>
                <CardDescription>{{ getProviderDescription(provider.provider) }}</CardDescription>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge v-if="provider.isActive" variant="default" class="bg-green-600">Activo</Badge>
              <Badge v-if="provider.isConfigured" variant="outline" class="text-xs">Configurado</Badge>
              <Badge v-else variant="secondary" class="text-xs">Sin configurar</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="provider.lastValidationError" class="text-xs text-red-600 mb-3 p-2 bg-red-50 rounded">
            {{ provider.lastValidationError }}
          </div>

          <!-- Test result -->
          <div v-if="testResult && editingProvider?.provider === provider.provider" class="mb-3 p-2 rounded text-xs" :class="testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
            {{ testResult.message }}
          </div>

          <div class="flex gap-2">
            <Button variant="outline" size="sm" @click="openConfigDialog(provider)">
              <SettingsIcon class="h-4 w-4 mr-1" />
              Configurar
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="handleTest(provider.provider)"
              :disabled="testing === provider.provider || !provider.isConfigured"
            >
              <Loader2Icon v-if="testing === provider.provider" class="h-4 w-4 mr-1 animate-spin" />
              <PlayIcon v-else class="h-4 w-4 mr-1" />
              Probar
            </Button>
            <Button
              v-if="!provider.isActive && provider.isConfigured"
              size="sm"
              @click="confirmActivate(provider.provider)"
            >
              <ZapIcon class="h-4 w-4 mr-1" />
              Activar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Config Dialog -->
    <Dialog v-model:open="showConfigDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle v-if="editingProvider">
            Configurar {{ getProviderLabel(editingProvider.provider) }}
          </DialogTitle>
          <DialogDescription>Configura las credenciales y opciones del proveedor</DialogDescription>
        </DialogHeader>
        <div v-if="editingProvider" class="space-y-4">
          <div v-for="field in getConfigFields(editingProvider.provider)" :key="field.key" class="space-y-2">
            <Label>
              {{ field.label }}
              <span v-if="field.required" class="text-destructive">*</span>
            </Label>
            <Input
              v-model="configForm[field.key]"
              :type="field.type"
              :placeholder="field.label"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showConfigDialog = false">Cancelar</Button>
          <Button @click="handleSaveConfig" :disabled="saving">
            <Loader2Icon v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Activate Confirmation -->
    <AlertDialog v-model:open="showActivateDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activar proveedor</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de activar {{ providerToActivate ? getProviderLabel(providerToActivate) : '' }}?
            El proveedor actual será desactivado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="activating">Cancelar</AlertDialogCancel>
          <AlertDialogAction @click="handleActivate" :disabled="activating">
            {{ activating ? 'Activando...' : 'Activar' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
