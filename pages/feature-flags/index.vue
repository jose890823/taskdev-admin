<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FeatureFlag } from '~/modules/feature-flags/types'
import { useFeatureFlags } from '~/modules/feature-flags/composables/useFeatureFlags'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  ToggleLeftIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  SearchIcon,
  Loader2Icon,
  XIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const {
  flags,
  loading,
  error,
  fetchFlags,
  toggleFlag,
  deleteFlag,
  clearError,
} = useFeatureFlags()

// Estado local
const searchQuery = ref('')
const showDeleteDialog = ref(false)
const flagToDelete = ref<FeatureFlag | null>(null)
const deleting = ref(false)
const toggling = ref<string | null>(null)

// Filtro local por busqueda
const filteredFlags = computed(() => {
  if (!searchQuery.value.trim()) return flags.value
  const query = searchQuery.value.toLowerCase()
  return flags.value.filter(
    (flag) =>
      flag.key.toLowerCase().includes(query) ||
      flag.name.toLowerCase().includes(query) ||
      (flag.description && flag.description.toLowerCase().includes(query))
  )
})

// Cargar datos
onMounted(async () => {
  try {
    await fetchFlags()
  } catch (e) {
    console.error('Error loading feature flags:', e)
  }
})

// Handlers
const handleCreate = () => {
  router.push('/feature-flags/create')
}

const handleEdit = (flag: FeatureFlag) => {
  router.push(`/feature-flags/create?edit=${flag.id}`)
}

const handleToggle = async (flag: FeatureFlag, newValue: boolean) => {
  toggling.value = flag.id
  try {
    await toggleFlag(flag.id, newValue)
  } catch (e) {
    console.error('Error toggling flag:', e)
  } finally {
    toggling.value = null
  }
}

const confirmDelete = (flag: FeatureFlag) => {
  flagToDelete.value = flag
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!flagToDelete.value) return
  deleting.value = true
  try {
    await deleteFlag(flagToDelete.value.id)
    showDeleteDialog.value = false
    flagToDelete.value = null
  } catch (e) {
    console.error('Error deleting flag:', e)
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Feature Flags</h1>
        <p class="text-xs text-muted-foreground">Gestiona las funcionalidades del sistema</p>
      </div>
      <Button @click="handleCreate">
        <PlusIcon class="h-4 w-4 mr-2" />
        Nuevo Flag
      </Button>
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

    <!-- Filtros -->
    <Card>
      <CardContent class="pt-6">
        <div class="relative">
          <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar por key, nombre o descripcion..."
            class="pl-10"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Tabla -->
    <Card v-else-if="filteredFlags.length > 0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">Estado</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead class="hidden md:table-cell">Descripcion</TableHead>
            <TableHead class="hidden lg:table-cell">Roles</TableHead>
            <TableHead class="hidden lg:table-cell">Creado</TableHead>
            <TableHead class="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="flag in filteredFlags" :key="flag.id">
            <TableCell>
              <Switch
                :checked="flag.isEnabled"
                :disabled="toggling === flag.id"
                @update:checked="(val: boolean) => handleToggle(flag, val)"
              />
            </TableCell>
            <TableCell>
              <code class="text-xs bg-muted px-2 py-1 rounded font-mono">{{ flag.key }}</code>
            </TableCell>
            <TableCell class="font-medium">{{ flag.name }}</TableCell>
            <TableCell class="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
              {{ flag.description || '-' }}
            </TableCell>
            <TableCell class="hidden lg:table-cell">
              <div v-if="flag.enabledForRoles && flag.enabledForRoles.length > 0" class="flex flex-wrap gap-1">
                <Badge
                  v-for="role in flag.enabledForRoles"
                  :key="role"
                  variant="secondary"
                  class="text-xs"
                >
                  {{ role }}
                </Badge>
              </div>
              <span v-else class="text-xs text-muted-foreground">Todos</span>
            </TableCell>
            <TableCell class="hidden lg:table-cell text-sm text-muted-foreground">
              {{ formatDate(flag.createdAt) }}
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" @click="handleEdit(flag)">
                  <PencilIcon class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="confirmDelete(flag)">
                  <Trash2Icon class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Empty state -->
    <Card v-else>
      <CardContent class="flex flex-col items-center justify-center py-12">
        <ToggleLeftIcon class="h-12 w-12 text-muted-foreground mb-4" />
        <p class="text-muted-foreground text-sm">
          {{ searchQuery ? 'No se encontraron feature flags con esa busqueda' : 'No hay feature flags creados' }}
        </p>
        <Button v-if="!searchQuery" variant="outline" class="mt-4" @click="handleCreate">
          <PlusIcon class="h-4 w-4 mr-2" />
          Crear primer flag
        </Button>
      </CardContent>
    </Card>

    <!-- Delete Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Feature Flag</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. Se eliminara permanentemente el feature flag
            <strong>"{{ flagToDelete?.name }}"</strong> ({{ flagToDelete?.key }}).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleting">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="deleting"
            @click.prevent="handleDelete"
          >
            <Loader2Icon v-if="deleting" class="h-4 w-4 mr-2 animate-spin" />
            {{ deleting ? 'Eliminando...' : 'Eliminar' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
