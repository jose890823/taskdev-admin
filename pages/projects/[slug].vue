<script setup lang="ts">
import { onMounted } from 'vue'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'

definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const route = useRoute()
const slug = route.params.slug as string

const { currentProject, projectModules, taskStatuses, projectMembers, loading, fetchBySlug, fetchModules, fetchStatuses, fetchMembers } = useProjects()

onMounted(async () => {
  await fetchBySlug(slug)
  if (currentProject.value) {
    await Promise.all([
      fetchModules(currentProject.value.id),
      fetchStatuses(currentProject.value.id),
      fetchMembers(currentProject.value.id),
    ])
  }
})
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <div v-if="loading" class="text-center py-12 text-muted-foreground">Cargando...</div>

    <template v-else-if="currentProject">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div v-if="currentProject.color" class="w-4 h-4 rounded-full" :style="{ backgroundColor: currentProject.color }" />
          <div>
            <h1 class="text-3xl font-bold tracking-tight">{{ currentProject.name }}</h1>
            <p class="text-muted-foreground mt-1">{{ currentProject.description || currentProject.slug }}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Modulos -->
        <Card>
          <CardHeader>
            <CardTitle>Modulos ({{ projectModules.length }})</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="projectModules.length === 0" class="text-muted-foreground text-sm">Sin modulos</div>
            <div v-else class="space-y-2">
              <div v-for="mod in projectModules" :key="mod.id" class="flex items-center gap-2 py-1">
                <div v-if="mod.color" class="w-2 h-2 rounded-full" :style="{ backgroundColor: mod.color }" />
                <span class="text-sm">{{ mod.name }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Estados -->
        <Card>
          <CardHeader>
            <CardTitle>Estados ({{ taskStatuses.length }})</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="taskStatuses.length === 0" class="text-muted-foreground text-sm">Sin estados</div>
            <div v-else class="space-y-2">
              <div v-for="status in taskStatuses" :key="status.id" class="flex items-center gap-2 py-1">
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: status.color }" />
                <span class="text-sm">{{ status.name }}</span>
                <Badge v-if="status.isDefault" variant="outline" class="text-xs">default</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Miembros -->
        <Card>
          <CardHeader>
            <CardTitle>Miembros ({{ projectMembers.length }})</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="projectMembers.length === 0" class="text-muted-foreground text-sm">Sin miembros</div>
            <div v-else class="space-y-2">
              <div v-for="member in projectMembers" :key="member.id" class="flex items-center justify-between py-1">
                <span class="text-sm">{{ member.userId }}</span>
                <Badge variant="outline">{{ member.role }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
