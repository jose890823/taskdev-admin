import { ref, computed } from 'vue'
import type { PaginationMeta, PaginationParams } from '../types/pagination'

export const usePagination = (defaultLimit = 20) => {
  const pagination = ref<PaginationMeta>({
    page: 1,
    limit: defaultLimit,
    total: 0,
    totalPages: 0,
  })

  const paginationParams = computed<PaginationParams>(() => ({
    page: pagination.value.page,
    limit: pagination.value.limit,
  }))

  const updatePagination = (meta: PaginationMeta) => {
    pagination.value = meta
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.value.totalPages) {
      pagination.value.page = page
    }
  }

  const nextPage = () => {
    if (pagination.value.page < pagination.value.totalPages) {
      pagination.value.page++
    }
  }

  const prevPage = () => {
    if (pagination.value.page > 1) {
      pagination.value.page--
    }
  }

  const resetPage = () => {
    pagination.value.page = 1
  }

  const hasNextPage = computed(() => pagination.value.page < pagination.value.totalPages)
  const hasPrevPage = computed(() => pagination.value.page > 1)

  return {
    pagination,
    paginationParams,
    updatePagination,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    hasNextPage,
    hasPrevPage,
  }
}
