<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch, nextTick } from 'vue'
import type { EditableColumnDef, CellUpdatePayload } from './types'
import EditableCell from './EditableCell.vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
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
  PencilIcon,
  Trash2Icon,
  CheckIcon,
  XIcon,
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  SaveIcon,
  RefreshCwIcon,
} from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  data: T[]
  columns: EditableColumnDef<T>[]
  loading?: boolean
  rowKey?: string
  newRowDefaults?: Partial<T>
  searchable?: boolean
  title?: string
  createLabel?: string
  hideCreate?: boolean
  hideDelete?: boolean
  hideEdit?: boolean
}>(), {
  loading: false,
  rowKey: 'id',
  searchable: false,
  createLabel: 'Nuevo',
  hideCreate: false,
  hideDelete: false,
  hideEdit: false,
})

const emit = defineEmits<{
  'save': [row: T]
  'create': [row: Partial<T>]
  'delete': [row: T]
  'update:cell': [payload: CellUpdatePayload<T>]
  'refresh': []
}>()

// State
const editingRowId = ref<string | null>(null)
const editingCellKey = ref<string | null>(null)
const editedValues = ref<Record<string, any>>({})
const newRow = ref<Record<string, any> | null>(null)
const showNewRow = ref(false)
const validationErrors = ref<Record<string, string | null>>({})
const searchQuery = ref('')
const showDeleteDialog = ref(false)
const rowToDelete = ref<T | null>(null)

// Editable columns (filter out readonly and computed)
const editableColumns = computed(() =>
  props.columns.filter(c => c.type !== 'readonly' && c.type !== 'computed' && c.editable !== false)
)

// Get row key value
const getRowKey = (row: T): string => {
  return String(row[props.rowKey] ?? '')
}

// Filtered data
const filteredData = computed(() => {
  if (!searchQuery.value) return props.data
  const q = searchQuery.value.toLowerCase()
  return props.data.filter(row =>
    props.columns.some(col => {
      const val = row[col.key]
      return val != null && String(val).toLowerCase().includes(q)
    })
  )
})

// Start editing a single cell (double-click)
const startCellEdit = (row: T, colKey: string) => {
  const col = props.columns.find(c => c.key === colKey)
  if (!col || col.type === 'readonly' || col.type === 'computed' || col.type === 'toggle' || col.editable === false) return

  const rowId = getRowKey(row)
  editingRowId.value = rowId
  editingCellKey.value = colKey
  editedValues.value = { [colKey]: row[colKey] }
  validationErrors.value = {}
}

// Start editing entire row
const startRowEdit = (row: T) => {
  const rowId = getRowKey(row)
  editingRowId.value = rowId
  editingCellKey.value = null // null means entire row

  const values: Record<string, any> = {}
  editableColumns.value.forEach(col => {
    values[col.key] = row[col.key]
  })
  editedValues.value = values
  validationErrors.value = {}
}

// Cancel editing
const cancelEdit = () => {
  editingRowId.value = null
  editingCellKey.value = null
  editedValues.value = {}
  validationErrors.value = {}
}

// Check if a cell is being edited
const isCellEditing = (row: T, colKey: string): boolean => {
  if (editingRowId.value !== getRowKey(row)) return false
  if (editingCellKey.value === null) return true // entire row editing
  return editingCellKey.value === colKey
}

// Get current value for a cell (edited or original)
const getCellValue = (row: T, col: EditableColumnDef<T>): any => {
  if (col.type === 'computed' && col.computeFn) {
    // For computed columns, use edited values if available
    const mergedRow = editingRowId.value === getRowKey(row)
      ? { ...row, ...editedValues.value }
      : row
    return col.computeFn(mergedRow as T)
  }

  if (editingRowId.value === getRowKey(row) && col.key in editedValues.value) {
    return editedValues.value[col.key]
  }
  return row[col.key]
}

// Update cell value
const updateCellValue = (key: string, value: any) => {
  editedValues.value[key] = value
  // Validate
  const col = props.columns.find(c => c.key === key)
  if (col?.validate) {
    const currentRow = props.data.find(r => getRowKey(r) === editingRowId.value)
    if (currentRow) {
      validationErrors.value[key] = col.validate(value, { ...currentRow, ...editedValues.value } as T)
    }
  }
}

// Validate all edited values
const validateRow = (row: T): boolean => {
  let valid = true
  const errors: Record<string, string | null> = {}

  editableColumns.value.forEach(col => {
    if (col.key in editedValues.value) {
      // Required check
      if (col.required && (editedValues.value[col.key] === null || editedValues.value[col.key] === undefined || editedValues.value[col.key] === '')) {
        errors[col.key] = `${col.label} es obligatorio`
        valid = false
        return
      }
      // Custom validation
      if (col.validate) {
        const err = col.validate(editedValues.value[col.key], { ...row, ...editedValues.value } as T)
        if (err) {
          errors[col.key] = err
          valid = false
        }
      }
    }
  })

  validationErrors.value = errors
  return valid
}

// Save edited row
const saveEdit = () => {
  if (!editingRowId.value) return

  const row = props.data.find(r => getRowKey(r) === editingRowId.value)
  if (!row) return

  if (!validateRow(row)) return

  const updatedRow = { ...row, ...editedValues.value } as T
  emit('save', updatedRow)
  cancelEdit()
}

// Handle Tab navigation
const handleTab = (currentKey: string) => {
  const editableCols = editableColumns.value
  const currentIndex = editableCols.findIndex(c => c.key === currentKey)

  if (currentIndex < editableCols.length - 1) {
    const nextCol = editableCols[currentIndex + 1]
    editedValues.value[nextCol.key] = editedValues.value[nextCol.key] ??
      (props.data.find(r => getRowKey(r) === editingRowId.value)?.[nextCol.key] ?? null)
    editingCellKey.value = null // switch to full row mode
  } else {
    saveEdit()
  }
}

// New row handling
const initNewRow = () => {
  const defaults: Record<string, any> = {}
  editableColumns.value.forEach(col => {
    defaults[col.key] = (props.newRowDefaults as any)?.[col.key] ?? (col.type === 'toggle' ? false : col.type === 'number' ? 0 : '')
  })
  newRow.value = defaults
  showNewRow.value = true
  validationErrors.value = {}
}

const cancelNewRow = () => {
  showNewRow.value = false
  newRow.value = null
  validationErrors.value = {}
}

const validateNewRow = (): boolean => {
  let valid = true
  const errors: Record<string, string | null> = {}

  editableColumns.value.forEach(col => {
    const val = newRow.value?.[col.key]
    if (col.required && (val === null || val === undefined || val === '')) {
      errors[col.key] = `${col.label} es obligatorio`
      valid = false
    }
    if (col.validate && newRow.value) {
      const err = col.validate(val, newRow.value as T)
      if (err) {
        errors[col.key] = err
        valid = false
      }
    }
  })

  validationErrors.value = errors
  return valid
}

const saveNewRow = () => {
  if (!newRow.value) return
  if (!validateNewRow()) return

  emit('create', newRow.value as Partial<T>)
  cancelNewRow()
}

// Delete handling
const confirmDelete = (row: T) => {
  rowToDelete.value = row
  showDeleteDialog.value = true
}

const handleDelete = () => {
  if (rowToDelete.value) {
    emit('delete', rowToDelete.value)
  }
  showDeleteDialog.value = false
  rowToDelete.value = null
}

// Toggle immediate save (no edit mode needed)
const toggleImmediate = (row: T, colKey: string) => {
  const currentValue = row[colKey]
  const updatedRow = { ...row, [colKey]: !currentValue } as T
  emit('save', updatedRow)
}

// Get column alignment class
const getAlignClass = (align?: string) => {
  switch (align) {
    case 'center': return 'text-center'
    case 'right': return 'text-right'
    default: return 'text-left'
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with search and add button -->
    <div class="flex items-center justify-between gap-4">
      <div v-if="title" class="font-semibold text-lg">{{ title }}</div>
      <div v-if="searchable" class="flex-1 max-w-sm">
        <div class="relative">
          <SearchIcon class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar..."
            class="pl-8 h-9"
          />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          @click="emit('refresh')"
          :disabled="loading"
          title="Recargar"
        >
          <RefreshCwIcon class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button
          v-if="!hideCreate"
          size="sm"
          @click="initNewRow"
          :disabled="showNewRow || loading"
        >
          <PlusIcon class="h-4 w-4 mr-1" />
          {{ createLabel }}
        </Button>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              v-for="col in columns"
              :key="col.key"
              :class="[getAlignClass(col.align)]"
              :style="col.width ? { width: col.width } : undefined"
            >
              {{ col.label }}
            </TableHead>
            <TableHead class="w-[1%] whitespace-nowrap">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- Loading state -->
          <TableRow v-if="loading">
            <TableCell :colspan="columns.length + 1" class="text-center py-8">
              <div class="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2Icon class="h-5 w-5 animate-spin" />
                <span>Cargando...</span>
              </div>
            </TableCell>
          </TableRow>

          <!-- Empty state -->
          <TableRow v-else-if="filteredData.length === 0 && !showNewRow">
            <TableCell :colspan="columns.length + 1" class="text-center py-8 text-muted-foreground">
              No hay registros. Haz clic en "{{ createLabel }}" para agregar uno.
            </TableCell>
          </TableRow>

          <!-- New row (first position) -->
          <TableRow v-if="showNewRow" class="bg-green-50 dark:bg-green-950/20">
            <TableCell
              v-for="col in columns"
              :key="col.key"
              :class="[getAlignClass(col.align), 'py-1.5 px-2']"
            >
              <EditableCell
                v-if="col.type !== 'readonly' && col.type !== 'computed' && col.editable !== false"
                :value="newRow?.[col.key]"
                :column="col"
                :editing="true"
                :error="validationErrors[col.key]"
                @update:value="(val) => { if (newRow) newRow[col.key] = val }"
                @enter="saveNewRow"
                @escape="cancelNewRow"
              />
              <span v-else class="text-sm text-muted-foreground">-</span>
            </TableCell>
            <TableCell class="py-1.5 px-2">
              <div class="flex items-center gap-1">
                <Button variant="ghost" size="sm" class="h-7 w-7 p-0" @click="saveNewRow" title="Crear">
                  <CheckIcon class="h-4 w-4 text-green-600" />
                </Button>
                <Button variant="ghost" size="sm" class="h-7 w-7 p-0" @click="cancelNewRow" title="Cancelar">
                  <XIcon class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>

          <!-- Data rows -->
          <TableRow
            v-for="row in filteredData"
            :key="getRowKey(row)"
            class="group"
            :class="{ 'bg-muted/50': editingRowId === getRowKey(row) }"
          >
            <TableCell
              v-for="col in columns"
              :key="col.key"
              :class="[getAlignClass(col.align), 'py-1.5 px-2']"
              @dblclick="startCellEdit(row, col.key)"
            >
              <EditableCell
                :value="getCellValue(row, col)"
                :column="col"
                :editing="isCellEditing(row, col.key)"
                :error="validationErrors[col.key]"
                @update:value="(val) => updateCellValue(col.key, val)"
                @enter="saveEdit"
                @escape="cancelEdit"
                @tab="handleTab(col.key)"
                @toggle="toggleImmediate(row, col.key)"
              />
            </TableCell>
            <TableCell class="py-1.5 px-2">
              <div class="flex items-center gap-1">
                <template v-if="editingRowId === getRowKey(row)">
                  <Button variant="ghost" size="sm" class="h-7 w-7 p-0" @click="saveEdit" title="Guardar">
                    <CheckIcon class="h-4 w-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" class="h-7 w-7 p-0" @click="cancelEdit" title="Cancelar">
                    <XIcon class="h-4 w-4 text-destructive" />
                  </Button>
                </template>
                <template v-else>
                  <Button v-if="!hideEdit" variant="ghost" size="sm" class="h-7 w-7 p-0" @click="startRowEdit(row)" title="Editar">
                    <PencilIcon class="h-3.5 w-3.5" />
                  </Button>
                  <Button v-if="!hideDelete" variant="ghost" size="sm" class="h-7 w-7 p-0 text-destructive" @click="confirmDelete(row)" title="Eliminar">
                    <Trash2Icon class="h-3.5 w-3.5" />
                  </Button>
                </template>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Delete confirmation dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion no se puede deshacer. ¿Estas seguro de que deseas eliminar este registro?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleDelete"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
