# DataTable Component

Componente de tabla reutilizable con todas las funcionalidades necesarias para operaciones CRUD.

## Características

- Paginación completa (cambiar página, tamaño de página)
- Ordenamiento por columnas (ascendente/descendente)
- Búsqueda/filtrado global
- Slots personalizables para celdas
- Soporte para TypeScript con genéricos
- Estados de carga y vacío
- Filas clicables opcionales
- Totalmente responsive

## Uso Básico

```vue
<script setup lang="ts">
import { DataTable } from '~/components/shared/DataTable'
import type { ColumnDef } from '~/components/shared/DataTable'

interface User {
  id: number
  name: string
  email: string
  role: string
}

const users = ref<User[]>([
  { id: 1, name: 'Juan', email: 'juan@example.com', role: 'admin' }
])

const columns: ColumnDef<User>[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Nombre', sortable: true, searchable: true },
  { key: 'email', label: 'Email', sortable: true, searchable: true },
  { key: 'role', label: 'Rol', sortable: true }
]
</script>

<template>
  <DataTable
    :data="users"
    :columns="columns"
    :searchable="true"
    search-placeholder="Buscar usuarios..."
  />
</template>
```

## Definición de Columnas

```typescript
interface ColumnDef<T> {
  key: string                         // Clave del campo en el objeto
  label: string                       // Título de la columna
  sortable?: boolean                  // Si permite ordenar
  searchable?: boolean                // Si se incluye en la búsqueda
  width?: string                      // Ancho personalizado
  align?: 'left' | 'center' | 'right' // Alineación
  render?: (row: T, value: any) => any // Renderizado personalizado
  format?: (value: any, row: T) => string // Formatear valor
  class?: string                      // Clases CSS personalizadas
  hidden?: boolean                    // Ocultar columna
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `data` | `T[]` | requerido | Datos a mostrar |
| `columns` | `ColumnDef<T>[]` | requerido | Definición de columnas |
| `pagination` | `PaginationConfig` | automático | Configuración de paginación |
| `searchable` | `boolean` | `true` | Mostrar input de búsqueda |
| `searchPlaceholder` | `string` | `"Buscar..."` | Placeholder del input |
| `loading` | `boolean` | `false` | Estado de carga |
| `emptyMessage` | `string` | `"No hay datos disponibles"` | Mensaje cuando no hay datos |
| `rowKey` | `string \| function` | `index` | Clave única de fila |
| `rowClass` | `string \| function` | `""` | Clase CSS para filas |
| `rowClickable` | `boolean` | `false` | Si las filas son clicables |

## Eventos

- `@row-click`: Emitido cuando se hace click en una fila (si `rowClickable` es true)
- `@update:pagination`: Emitido cuando cambia la paginación
- `@update:sort`: Emitido cuando cambia el ordenamiento
- `@update:search`: Emitido cuando cambia el término de búsqueda

## Slots Personalizados

Puedes personalizar el contenido de cualquier celda usando slots:

```vue
<DataTable :data="users" :columns="columns">
  <!-- Slot para una columna específica -->
  <template #cell-status="{ row, value }">
    <Badge :variant="getStatusVariant(value)">
      {{ value }}
    </Badge>
  </template>

  <!-- Slot para acciones -->
  <template #cell-actions="{ row }">
    <Button @click="edit(row)">Editar</Button>
    <Button @click="delete(row)">Eliminar</Button>
  </template>
</DataTable>
```

## Ejemplos Avanzados

### Con Paginación Controlada

```vue
<script setup lang="ts">
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 100,
  pageSizeOptions: [10, 20, 50, 100]
})

const handlePaginationChange = (newPagination) => {
  pagination.value = newPagination
  // Hacer fetch de nuevos datos desde el servidor
}
</script>

<template>
  <DataTable
    :data="users"
    :columns="columns"
    :pagination="pagination"
    @update:pagination="handlePaginationChange"
  />
</template>
```

### Con Formateo de Valores

```typescript
const columns: ColumnDef<User>[] = [
  {
    key: 'createdAt',
    label: 'Fecha de Registro',
    sortable: true,
    format: (value) => {
      return new Date(value).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
]
```

### Con Filas Clicables

```vue
<template>
  <DataTable
    :data="users"
    :columns="columns"
    :row-clickable="true"
    @row-click="handleRowClick"
  />
</template>

<script setup lang="ts">
const handleRowClick = (user: User) => {
  navigateTo(`/users/${user.id}`)
}
</script>
```

## Página de Demo

Visita `/demo/table` para ver un ejemplo completo con todos los features del componente.
