<script setup lang="ts">
import { onMounted } from 'vue'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { BulkPositionItem } from '~/modules/tasks/types'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string
const toast = useToast()

const {
  currentProject, taskStatuses,
  loading, fetchBySlug, fetchStatuses,
} = useProjects()

const {
  tasks: projectTasks, loading: tasksLoading,
  fetchAll: fetchTasks, bulkUpdatePositions,
} = useTasks()

const handleBulkUpdate = async (items: BulkPositionItem[]) => {
  await bulkUpdatePositions(items)
}

const handleTaskClick = (task: { id: string }) => {
  router.push(`/tasks/${task.id}`)
}

onMounted(async () => {
  await fetchBySlug(slug)
  if (currentProject.value) {
    await Promise.all([
      fetchStatuses(currentProject.value.id),
      fetchTasks({ projectId: currentProject.value.id, limit: 500 }),
    ])
  }
})
</script>

<template>
  <div class="px-4 py-3 space-y-3">
    <div v-if="loading" class="text-center py-12 text-muted-foreground">Cargando...</div>

    <template v-else-if="currentProject">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="sm" @click="router.push(`/projects/${slug}`)">
            &larr; Volver
          </Button>
          <div
            v-if="currentProject.color"
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: currentProject.color }"
          />
          <h1 class="text-xl font-bold">{{ currentProject.name }}</h1>
          <Badge variant="secondary">Kanban</Badge>
        </div>
      </div>

      <!-- Kanban Board -->
      <KanbanBoard
        :statuses="taskStatuses"
        :tasks="projectTasks"
        :loading="tasksLoading"
        :storage-key="slug"
        @task-click="handleTaskClick"
        @bulk-update="handleBulkUpdate"
      />
    </template>
  </div>
</template>
