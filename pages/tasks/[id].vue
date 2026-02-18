<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTasks } from '~/modules/tasks/composables/useTasks'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const route = useRoute()
const taskId = route.params.id as string

const { currentTask, subtasks, comments, loading, error, fetchById, fetchSubtasks, fetchComments, addComment } = useTasks()

const newComment = ref('')

onMounted(async () => {
  await Promise.all([
    fetchById(taskId),
    fetchSubtasks(taskId),
    fetchComments(taskId),
  ])
})

const handleAddComment = async () => {
  if (!newComment.value.trim()) return
  await addComment({ taskId, content: newComment.value })
  newComment.value = ''
}
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <div v-if="loading" class="text-center py-12 text-muted-foreground">Cargando...</div>

    <template v-else-if="currentTask">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ currentTask.title }}</h1>
        <div class="flex gap-2 mt-2">
          <Badge variant="outline">{{ currentTask.type }}</Badge>
          <Badge variant="outline">{{ currentTask.priority }}</Badge>
          <Badge v-if="currentTask.completedAt" variant="default" class="bg-green-600">Completada</Badge>
        </div>
      </div>

      <div v-if="currentTask.description" class="text-muted-foreground">
        {{ currentTask.description }}
      </div>

      <Separator />

      <!-- Subtareas -->
      <Card>
        <CardHeader>
          <CardTitle>Subtareas ({{ subtasks.length }})</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="subtasks.length === 0" class="text-muted-foreground text-sm">Sin subtareas</div>
          <div v-else class="space-y-2">
            <div v-for="sub in subtasks" :key="sub.id" class="flex items-center gap-2 py-1">
              <div class="w-2 h-2 rounded-full" :class="sub.completedAt ? 'bg-green-500' : 'bg-gray-300'" />
              <span :class="{ 'line-through text-muted-foreground': sub.completedAt }">{{ sub.title }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Comentarios -->
      <Card>
        <CardHeader>
          <CardTitle>Comentarios ({{ comments.length }})</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="comments.length === 0" class="text-muted-foreground text-sm">Sin comentarios</div>
          <div v-else class="space-y-3">
            <div v-for="comment in comments" :key="comment.id" class="border-l-2 pl-3 py-1">
              <p class="text-sm">{{ comment.content }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ new Date(comment.createdAt).toLocaleString() }}</p>
            </div>
          </div>

          <div class="flex gap-2">
            <Input v-model="newComment" placeholder="Agregar comentario..." @keyup.enter="handleAddComment" />
            <Button :disabled="!newComment.trim()" @click="handleAddComment">Enviar</Button>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
