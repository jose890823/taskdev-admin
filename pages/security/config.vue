<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SecurityConfig } from '~/modules/security/types'
import { useSecurity } from '~/modules/security/composables/useSecurity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  ArrowLeftIcon,
  SaveIcon,
  Loader2Icon,
  XIcon,
  EditIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const { configs, loading, error, fetchConfigs, updateConfig, clearError } = useSecurity()

const showEditDialog = ref(false)
const editingConfig = ref<SecurityConfig | null>(null)
const editValue = ref('')
const saving = ref(false)

onMounted(async () => {
  await fetchConfigs()
})

const openEditDialog = (config: SecurityConfig) => {
  editingConfig.value = config
  editValue.value = config.value
  showEditDialog.value = true
}

const handleSave = async () => {
  if (!editingConfig.value) return
  saving.value = true
  try {
    await updateConfig({ key: editingConfig.value.key, value: editValue.value })
    showEditDialog.value = false
  } catch (e) {
    console.error('Error updating config:', e)
  } finally {
    saving.value = false
  }
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    general: 'General',
    rate_limiting: 'Rate Limiting',
    session: 'Sesiones',
    authentication: 'Autenticación',
    cors: 'CORS',
  }
  return labels[category] || category
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    string: 'Texto',
    number: 'Número',
    boolean: 'Booleano',
    json: 'JSON',
  }
  return labels[type] || type
}

// Group configs by category
const groupedConfigs = computed(() => {
  const groups: Record<string, SecurityConfig[]> = {}
  for (const config of configs.value) {
    const cat = config.category || 'general'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(config)
  }
  return groups
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="router.push('/security')">
        <ArrowLeftIcon class="h-4 w-4" />
      </Button>
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Configuración de Seguridad</h1>
        <p class="text-xs text-muted-foreground">Ajusta los parámetros de seguridad del sistema</p>
      </div>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError"><XIcon class="h-4 w-4" /></Button>
      </div>
    </div>

    <div v-if="loading && configs.length === 0" class="flex items-center justify-center py-12">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <div v-for="(categoryConfigs, category) in groupedConfigs" :key="category" class="space-y-2">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">{{ getCategoryLabel(category as string) }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div
              v-for="config in categoryConfigs"
              :key="config.key"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-sm font-mono">{{ config.key }}</p>
                  <Badge variant="outline" class="text-xs">{{ getTypeLabel(config.valueType) }}</Badge>
                </div>
                <p class="text-xs text-muted-foreground mt-1">{{ config.description }}</p>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm font-mono bg-muted px-2 py-1 rounded">{{ config.value }}</span>
                <Button variant="ghost" size="sm" @click="openEditDialog(config)">
                  <EditIcon class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Edit Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Configuración</DialogTitle>
          <DialogDescription v-if="editingConfig">
            {{ editingConfig.description }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="editingConfig" class="space-y-4">
          <div>
            <Label class="text-muted-foreground">Clave</Label>
            <p class="font-mono text-sm">{{ editingConfig.key }}</p>
          </div>
          <div>
            <Label class="text-muted-foreground">Tipo</Label>
            <Badge variant="outline">{{ getTypeLabel(editingConfig.valueType) }}</Badge>
          </div>
          <div class="space-y-2">
            <Label>Valor</Label>
            <Input v-model="editValue" :type="editingConfig.valueType === 'number' ? 'number' : 'text'" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showEditDialog = false">Cancelar</Button>
          <Button @click="handleSave" :disabled="saving">
            <Loader2Icon v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
            <SaveIcon v-else class="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
