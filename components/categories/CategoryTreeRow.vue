<script setup lang="ts">
import type { Category } from '~/modules/categories/types'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  PencilIcon,
  Trash2Icon,
  ChevronRightIcon,
  ChevronDownIcon,
} from 'lucide-vue-next'

const props = defineProps<{
  category: Category
  depth: number
  expandedIds: Set<string>
}>()

const emit = defineEmits<{
  'toggle-expand': [id: string]
  'edit': [category: Category]
  'delete': [category: Category]
}>()

const hasChildren = props.category.children && props.category.children.length > 0
const isExpanded = props.expandedIds.has(props.category.id)

const paddingLeft = `${props.depth * 24 + 16}px`
</script>

<template>
  <div>
    <!-- Fila de la categoria -->
    <div
      class="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-muted/30 transition-colors items-center text-sm"
    >
      <!-- Nombre con indentacion y icono de expandir -->
      <div class="col-span-5 flex items-center gap-2" :style="{ paddingLeft }">
        <button
          v-if="hasChildren"
          class="flex-shrink-0 p-0.5 rounded hover:bg-muted"
          @click="emit('toggle-expand', category.id)"
        >
          <ChevronDownIcon v-if="expandedIds.has(category.id)" class="h-4 w-4 text-muted-foreground" />
          <ChevronRightIcon v-else class="h-4 w-4 text-muted-foreground" />
        </button>
        <div v-else class="w-5 flex-shrink-0" />

        <span v-if="category.icon" class="flex-shrink-0 text-base">{{ category.icon }}</span>

        <span class="font-medium truncate">{{ category.name }}</span>

        <Badge v-if="hasChildren" variant="outline" class="text-xs ml-1">
          {{ category.children!.length }}
        </Badge>
      </div>

      <!-- Slug -->
      <div class="col-span-2 text-muted-foreground truncate">
        {{ category.slug }}
      </div>

      <!-- Comision -->
      <div class="col-span-1 text-center">
        <span v-if="category.commissionPercentage !== undefined && category.commissionPercentage !== null">
          {{ category.commissionPercentage }}%
        </span>
        <span v-else class="text-muted-foreground">-</span>
      </div>

      <!-- Estado -->
      <div class="col-span-1 text-center">
        <Badge :variant="category.isActive ? 'default' : 'secondary'">
          {{ category.isActive ? 'Activa' : 'Inactiva' }}
        </Badge>
      </div>

      <!-- Orden -->
      <div class="col-span-1 text-center text-muted-foreground">
        {{ category.sortOrder }}
      </div>

      <!-- Acciones -->
      <div class="col-span-2 flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="sm"
          @click="emit('edit', category)"
          title="Editar categoria"
        >
          <PencilIcon class="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          @click="emit('delete', category)"
          title="Eliminar categoria"
        >
          <Trash2Icon class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Hijos (renderizado recursivo) -->
    <template v-if="hasChildren && expandedIds.has(category.id)">
      <CategoryTreeRow
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :depth="depth + 1"
        :expanded-ids="expandedIds"
        @toggle-expand="(id) => emit('toggle-expand', id)"
        @edit="(cat) => emit('edit', cat)"
        @delete="(cat) => emit('delete', cat)"
      />
    </template>
  </div>
</template>
