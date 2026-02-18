<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Translation, TranslationLocale } from '~/modules/i18n/types'
import { useTranslations } from '~/modules/i18n/composables/useTranslations'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  LanguagesIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  SearchIcon,
  Loader2Icon,
  XIcon,
  DownloadIcon,
  UploadIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const {
  translations,
  translationStats,
  loading,
  error,
  total,
  page,
  limit,
  fetchTranslations,
  deleteTranslation,
  exportTranslations,
  reloadCache,
  fetchStats,
  clearError,
} = useTranslations()

// Estado local
const searchQuery = ref('')
const localeFilter = ref<string>('all')
const moduleFilter = ref('')
const showDeleteDialog = ref(false)
const translationToDelete = ref<Translation | null>(null)
const deleting = ref(false)
const exporting = ref(false)
const reloading = ref(false)
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

// Locales disponibles
const locales = [
  { value: 'es', label: 'Espanol' },
  { value: 'en', label: 'Ingles' },
  { value: 'fr', label: 'Frances' },
  { value: 'pt', label: 'Portugues' },
]

// Mapa de colores para locale badges
const localeBadgeVariant = (locale: string) => {
  switch (locale) {
    case 'es': return 'default'
    case 'en': return 'secondary'
    case 'fr': return 'outline'
    case 'pt': return 'secondary'
    default: return 'outline'
  }
}

// Total de paginas
const totalPages = computed(() => Math.ceil(total.value / limit.value))

// Cargar datos
const loadData = async () => {
  try {
    await fetchTranslations({
      search: searchQuery.value || undefined,
      locale: (localeFilter.value !== 'all' ? localeFilter.value : undefined) as TranslationLocale | undefined,
      module: moduleFilter.value || undefined,
      page: page.value,
      limit: limit.value,
    })
  } catch (e) {
    console.error('Error loading translations:', e)
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadData(), fetchStats()])
  } catch (e) {
    console.error('Error loading i18n data:', e)
  }
})

// Busqueda con debounce
watch(searchQuery, () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    page.value = 1
    loadData()
  }, 400)
})

// Recargar al cambiar filtros
watch([localeFilter, moduleFilter], () => {
  page.value = 1
  loadData()
})

// Handlers
const handleCreate = () => {
  router.push('/i18n/create')
}

const handleEdit = (translation: Translation) => {
  router.push(`/i18n/create?edit=${translation.id}`)
}

const handleImport = () => {
  router.push('/i18n/create?mode=import')
}

const handleExport = async (locale: TranslationLocale) => {
  exporting.value = true
  try {
    const data = await exportTranslations(locale)
    // Descargar como archivo JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `translations-${locale}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Error exporting translations:', e)
  } finally {
    exporting.value = false
  }
}

const handleReloadCache = async () => {
  reloading.value = true
  try {
    await reloadCache()
  } catch (e) {
    console.error('Error reloading cache:', e)
  } finally {
    reloading.value = false
  }
}

const confirmDelete = (translation: Translation) => {
  translationToDelete.value = translation
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!translationToDelete.value) return
  deleting.value = true
  try {
    await deleteTranslation(translationToDelete.value.id)
    showDeleteDialog.value = false
    translationToDelete.value = null
    await fetchStats()
  } catch (e) {
    console.error('Error deleting translation:', e)
  } finally {
    deleting.value = false
  }
}

const goToPage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
  loadData()
}

const clearFilters = () => {
  searchQuery.value = ''
  localeFilter.value = 'all'
  moduleFilter.value = ''
  page.value = 1
  loadData()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const truncateValue = (value: string, maxLength = 60) => {
  if (value.length <= maxLength) return value
  return value.substring(0, maxLength) + '...'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Traducciones</h1>
          <p class="text-xs text-muted-foreground">Gestiona las traducciones del sistema</p>
        </div>
        <!-- Stats badges -->
        <div v-if="translationStats" class="flex items-center gap-2">
          <Badge variant="secondary">
            {{ translationStats.total }} total
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Reload Cache -->
        <Button variant="outline" size="sm" :disabled="reloading" @click="handleReloadCache">
          <RefreshCwIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': reloading }" />
          {{ reloading ? 'Recargando...' : 'Recargar Cache' }}
        </Button>

        <!-- Export Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" :disabled="exporting">
              <DownloadIcon class="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="locale in locales"
              :key="locale.value"
              @click="handleExport(locale.value as TranslationLocale)"
            >
              {{ locale.label }} ({{ locale.value }})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Create -->
        <Button @click="handleCreate">
          <PlusIcon class="h-4 w-4 mr-2" />
          Nueva Traduccion
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

    <!-- Stats Cards -->
    <div v-if="translationStats" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent class="pt-6">
          <div class="text-2xl font-bold">{{ translationStats.total }}</div>
          <p class="text-xs text-muted-foreground">Total</p>
        </CardContent>
      </Card>
      <Card v-for="locale in locales" :key="locale.value">
        <CardContent class="pt-6">
          <div class="text-2xl font-bold">
            {{ translationStats.byLocale?.[locale.value] || 0 }}
          </div>
          <p class="text-xs text-muted-foreground">{{ locale.label }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Filtros -->
    <Card>
      <CardContent class="pt-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="relative md:col-span-2">
            <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Buscar por key o valor..."
              class="pl-10"
            />
          </div>

          <!-- Locale filter -->
          <Select
            :model-value="localeFilter"
            @update:model-value="localeFilter = $event"
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los idiomas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los idiomas</SelectItem>
              <SelectItem v-for="locale in locales" :key="locale.value" :value="locale.value">
                {{ locale.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Namespace filter -->
          <div class="flex gap-2">
            <Input
              v-model="moduleFilter"
              placeholder="Modulo..."
            />
            <Button
              v-if="searchQuery || localeFilter !== 'all' || moduleFilter"
              variant="ghost"
              size="icon"
              @click="clearFilters"
            >
              <XIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Tabla -->
    <Card v-else-if="translations.length > 0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Idioma</TableHead>
            <TableHead class="hidden md:table-cell">Modulo</TableHead>
            <TableHead class="hidden lg:table-cell">Sistema</TableHead>
            <TableHead class="hidden lg:table-cell">Actualizado</TableHead>
            <TableHead class="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="translation in translations" :key="translation.id">
            <TableCell>
              <code class="text-xs bg-muted px-2 py-1 rounded font-mono">
                {{ translation.key }}
              </code>
            </TableCell>
            <TableCell class="max-w-[250px]">
              <span class="text-sm" :title="translation.value">
                {{ truncateValue(translation.value) }}
              </span>
            </TableCell>
            <TableCell>
              <Badge :variant="localeBadgeVariant(translation.locale)">
                {{ translation.locale.toUpperCase() }}
              </Badge>
            </TableCell>
            <TableCell class="hidden md:table-cell">
              <Badge variant="outline" class="text-xs">
                {{ translation.module }}
              </Badge>
            </TableCell>
            <TableCell class="hidden lg:table-cell">
              <CheckIcon
                v-if="translation.isSystem"
                class="h-4 w-4 text-muted-foreground"
              />
              <span v-else class="text-xs text-muted-foreground">-</span>
            </TableCell>
            <TableCell class="hidden lg:table-cell text-sm text-muted-foreground">
              {{ formatDate(translation.updatedAt) }}
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" @click="handleEdit(translation)">
                  <PencilIcon class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="confirmDelete(translation)">
                  <Trash2Icon class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- Paginacion -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t">
        <p class="text-sm text-muted-foreground">
          Mostrando {{ ((page - 1) * limit) + 1 }}-{{ Math.min(page * limit, total) }} de {{ total }}
        </p>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="page <= 1"
            @click="goToPage(page - 1)"
          >
            <ChevronLeftIcon class="h-4 w-4" />
          </Button>
          <span class="text-sm text-muted-foreground">
            {{ page }} / {{ totalPages }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="page >= totalPages"
            @click="goToPage(page + 1)"
          >
            <ChevronRightIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>

    <!-- Empty state -->
    <Card v-else>
      <CardContent class="flex flex-col items-center justify-center py-12">
        <LanguagesIcon class="h-12 w-12 text-muted-foreground mb-4" />
        <p class="text-muted-foreground text-sm">
          {{ searchQuery || localeFilter !== 'all' || moduleFilter
            ? 'No se encontraron traducciones con esos filtros'
            : 'No hay traducciones creadas'
          }}
        </p>
        <Button v-if="!searchQuery && !localeFilter && !moduleFilter" variant="outline" class="mt-4" @click="handleCreate">
          <PlusIcon class="h-4 w-4 mr-2" />
          Crear primera traduccion
        </Button>
      </CardContent>
    </Card>

    <!-- Delete Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Traduccion</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. Se eliminara permanentemente la traduccion
            <strong>"{{ translationToDelete?.key }}"</strong> ({{ translationToDelete?.locale }}).
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
