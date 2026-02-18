<script setup lang="ts">
import { computed } from 'vue'
import type { PaginationMeta } from '~/modules/_shared/types/pagination'
import { Button } from '~/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'

const props = defineProps<{
  pagination: PaginationMeta
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const from = computed(() => {
  if (props.pagination.total === 0) return 0
  return (props.pagination.page - 1) * props.pagination.limit + 1
})

const to = computed(() => {
  return Math.min(props.pagination.page * props.pagination.limit, props.pagination.total)
})

const hasPrev = computed(() => props.pagination.page > 1)
const hasNext = computed(() => props.pagination.page < props.pagination.totalPages)
</script>

<template>
  <div v-if="pagination.totalPages > 0" class="flex items-center justify-between px-2 py-3">
    <p class="text-sm text-muted-foreground">
      Mostrando {{ from }} a {{ to }} de {{ pagination.total }}
    </p>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="!hasPrev"
        @click="emit('update:page', pagination.page - 1)"
      >
        <ChevronLeftIcon class="h-4 w-4 mr-1" />
        Anterior
      </Button>
      <span class="text-sm text-muted-foreground">
        Pagina {{ pagination.page }} de {{ pagination.totalPages }}
      </span>
      <Button
        variant="outline"
        size="sm"
        :disabled="!hasNext"
        @click="emit('update:page', pagination.page + 1)"
      >
        Siguiente
        <ChevronRightIcon class="h-4 w-4 ml-1" />
      </Button>
    </div>
  </div>
</template>
