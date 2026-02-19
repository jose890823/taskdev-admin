<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch } from 'vue'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-vue-next'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type {
  ColumnDef,
  PaginationConfig,
  SortConfig,
  SortDirection,
  DataTableProps,
  DataTableEmits,
} from './types'

// Props
const props = withDefaults(defineProps<DataTableProps<T>>(), {
  searchable: false,
  searchPlaceholder: 'Buscar...',
  loading: false,
  emptyMessage: 'No hay datos disponibles',
  rowClickable: false,
})

// Emits
const emit = defineEmits<DataTableEmits>()

// Estado local
const searchTerm = ref('')
const sortConfig = ref<SortConfig>({ key: '', direction: null })

// Paginación local (si no se proporciona desde el padre)
const localPagination = ref<PaginationConfig>({
  page: 1,
  pageSize: 20,
  total: 0,
  pageSizeOptions: [5, 10, 20, 50, 100],
})

// Usar paginación del padre o local
const currentPagination = computed(() => props.pagination || localPagination.value)

// Datos filtrados por búsqueda
const filteredData = computed(() => {
  if (!searchTerm.value || !props.searchable) {
    return props.data
  }

  const term = searchTerm.value.toLowerCase()
  const searchableColumns = props.columns
    .filter((col) => col.searchable !== false)
    .map((col) => col.key)

  return props.data.filter((row) => {
    return searchableColumns.some((key) => {
      const value = row[key]
      if (value == null) return false
      return String(value).toLowerCase().includes(term)
    })
  })
})

// Datos ordenados
const sortedData = computed(() => {
  if (!sortConfig.value.key || !sortConfig.value.direction) {
    return filteredData.value
  }

  const sorted = [...filteredData.value]
  const { key, direction } = sortConfig.value

  sorted.sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal == null && bVal == null) return 0
    if (aVal == null) return direction === 'asc' ? 1 : -1
    if (bVal == null) return direction === 'asc' ? -1 : 1

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })

  return sorted
})

// Datos paginados
const paginatedData = computed(() => {
  const { page, pageSize } = currentPagination.value
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return sortedData.value.slice(start, end)
})

// Total de páginas
const totalPages = computed(() => {
  return Math.ceil(sortedData.value.length / currentPagination.value.pageSize)
})

// Actualizar total cuando cambien los datos filtrados
watch(
  () => sortedData.value.length,
  (newTotal) => {
    if (!props.pagination) {
      localPagination.value.total = newTotal
    }
  },
  { immediate: true }
)

// Obtener clave de fila
const getRowKey = (row: T, index: number): string | number => {
  if (!props.rowKey) return index
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey]
}

// Obtener clase de fila
const getRowClass = (row: T): string => {
  const baseClass = props.rowClickable ? 'cursor-pointer hover:bg-muted/50' : ''
  if (!props.rowClass) return baseClass

  const customClass = typeof props.rowClass === 'function' ? props.rowClass(row) : props.rowClass
  return `${baseClass} ${customClass}`.trim()
}

// Manejar ordenamiento
const handleSort = (column: ColumnDef<T>) => {
  if (!column.sortable) return

  let newDirection: SortDirection = 'asc'

  if (sortConfig.value.key === column.key) {
    if (sortConfig.value.direction === 'asc') {
      newDirection = 'desc'
    } else if (sortConfig.value.direction === 'desc') {
      newDirection = null
    }
  }

  sortConfig.value = {
    key: column.key,
    direction: newDirection,
  }

  emit('update:sort', sortConfig.value)
}

// Icono de ordenamiento
const getSortIcon = (column: ColumnDef<T>) => {
  if (sortConfig.value.key !== column.key) return ArrowUpDown
  if (sortConfig.value.direction === 'asc') return ArrowUp
  if (sortConfig.value.direction === 'desc') return ArrowDown
  return ArrowUpDown
}

// Manejar cambio de búsqueda
watch(searchTerm, (newTerm) => {
  emit('update:search', newTerm)
  // Resetear a la primera página cuando se busca
  if (!props.pagination) {
    localPagination.value.page = 1
  }
})

// Manejar cambio de página
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return

  if (props.pagination) {
    emit('update:pagination', { ...props.pagination, page })
  } else {
    localPagination.value.page = page
  }
}

// Manejar cambio de tamaño de página
const changePageSize = (pageSize: any) => {
  if (!pageSize) return
  const newPageSize = typeof pageSize === 'string' ? parseInt(pageSize) : Number(pageSize)

  if (props.pagination) {
    emit('update:pagination', { ...props.pagination, pageSize: newPageSize, page: 1 })
  } else {
    localPagination.value.pageSize = newPageSize
    localPagination.value.page = 1
  }
}

// Manejar click en fila
const handleRowClick = (row: T) => {
  if (props.rowClickable) {
    emit('row-click', row)
  }
}

// Obtener valor de celda
const getCellValue = (row: T, column: ColumnDef<T>) => {
  const value = row[column.key]

  // Si hay función de render personalizada
  if (column.render) {
    return column.render(row, value)
  }

  // Si hay función de formato
  if (column.format) {
    return column.format(value, row)
  }

  return value
}

// Columnas visibles
const visibleColumns = computed(() => props.columns.filter((col) => !col.hidden))
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Barra de búsqueda -->
    <div v-if="searchable" class="flex items-center gap-2">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchTerm"
          :placeholder="searchPlaceholder"
          class="pl-9"
        />
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow class="bg-muted/50 hover:bg-muted/50">
            <TableHead
              v-for="column in visibleColumns"
              :key="column.key"
              :class="[
                column.class,
                'text-foreground font-semibold text-left',
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right',
                column.sortable && 'cursor-pointer select-none hover:bg-muted',
              ]"
              :style="column.width ? { width: column.width } : undefined"
              @click="column.sortable && handleSort(column)"
            >
              <div class="flex items-center gap-2">
                <span>{{ column.label }}</span>
                <component
                  :is="getSortIcon(column)"
                  v-if="column.sortable"
                  class="h-4 w-4"
                />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Estado de carga -->
          <TableRow v-if="loading">
            <TableCell :colspan="visibleColumns.length" class="text-center py-8">
              <div class="flex items-center justify-center gap-2">
                <Loader2 class="h-5 w-5 animate-spin" />
                <span>Cargando...</span>
              </div>
            </TableCell>
          </TableRow>

          <!-- Sin datos -->
          <TableRow v-else-if="paginatedData.length === 0">
            <TableCell :colspan="visibleColumns.length" class="text-center py-16">
              <div class="flex flex-col items-center justify-center space-y-4">
                <!-- Icono -->
                <div class="rounded-full bg-muted p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-12 w-12 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                </div>

                <!-- Texto -->
                <div class="space-y-1">
                  <p class="text-lg font-semibold text-foreground">{{ emptyMessage }}</p>
                  <p class="text-sm text-muted-foreground max-w-md">
                    No se encontraron registros que coincidan con los criterios de búsqueda.
                  </p>
                </div>
              </div>
            </TableCell>
          </TableRow>

          <!-- Filas de datos -->
          <TableRow
            v-else
            v-for="(row, index) in paginatedData"
            :key="getRowKey(row, index)"
            :class="[
              getRowClass(row),
              index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
            ]"
            @click="handleRowClick(row)"
          >
            <TableCell
              v-for="column in visibleColumns"
              :key="column.key"
              :class="[
                column.class,
                'text-left',
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right',
              ]"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="row[column.key]"
                :column="column"
              >
                {{ getCellValue(row, column) }}
              </slot>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Filas por página:</span>
        <Select
          :model-value="String(currentPagination.pageSize)"
          @update:model-value="changePageSize"
        >
          <SelectTrigger class="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="size in currentPagination.pageSizeOptions || [5, 10, 20, 50, 100]"
              :key="size"
              :value="String(size)"
            >
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span class="ml-4">
          Mostrando {{ (currentPagination.page - 1) * currentPagination.pageSize + 1 }} -
          {{ Math.min(currentPagination.page * currentPagination.pageSize, sortedData.length) }}
          de {{ sortedData.length }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPagination.page === 1"
          @click="goToPage(1)"
        >
          <ChevronsLeft class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPagination.page === 1"
          @click="goToPage(currentPagination.page - 1)"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span class="text-sm">
          Página {{ currentPagination.page }} de {{ totalPages }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPagination.page === totalPages"
          @click="goToPage(currentPagination.page + 1)"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPagination.page === totalPages"
          @click="goToPage(totalPages)"
        >
          <ChevronsRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
