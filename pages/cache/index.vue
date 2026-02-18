<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCache } from '~/modules/cache/composables/useCache'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
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
  DatabaseIcon,
  RefreshCwIcon,
  Loader2Icon,
  XIcon,
  SearchIcon,
  Trash2Icon,
  ZapIcon,
  HeartPulseIcon,
  KeyIcon,
  HardDriveIcon,
  ClockIcon,
  UsersIcon,
  ActivityIcon,
  MemoryStickIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const {
  stats,
  health,
  keys,
  keysTotal,
  loading,
  error,
  fetchStats,
  fetchHealth,
  fetchKeys,
  invalidateCache,
  flushCache,
  clearError,
} = useCache()

// Estado local
const searchPattern = ref('*')
const invalidatePattern = ref('')
const showFlushDialog = ref(false)
const flushing = ref(false)
const invalidating = ref(false)
const searching = ref(false)
const refreshing = ref(false)

// Computed
const healthStatusVariant = computed(() => {
  if (!health.value) return 'secondary' as const
  if (health.value.status === 'healthy') return 'default' as const
  if (health.value.status === 'degraded') return 'default' as const
  return 'destructive' as const
})

const healthStatusColor = computed(() => {
  if (!health.value) return 'text-muted-foreground'
  if (health.value.status === 'healthy') return 'text-green-600'
  if (health.value.status === 'degraded') return 'text-amber-600'
  return 'text-red-600'
})

const healthBgColor = computed(() => {
  if (!health.value) return 'bg-muted'
  if (health.value.status === 'healthy') return 'bg-green-50 dark:bg-green-950/20'
  if (health.value.status === 'degraded') return 'bg-amber-50 dark:bg-amber-950/20'
  return 'bg-red-50 dark:bg-red-950/20'
})

// Formatear uptime
const formatUptime = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '-'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Formatear TTL
const formatTtl = (ttl: number): string => {
  if (ttl === -1) return 'Sin expirar'
  if (ttl === -2) return 'Expirada'
  if (ttl < 60) return `${ttl}s`
  if (ttl < 3600) return `${Math.floor(ttl / 60)}m ${ttl % 60}s`
  if (ttl < 86400) return `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m`
  return `${Math.floor(ttl / 86400)}d ${Math.floor((ttl % 86400) / 3600)}h`
}

// Formatear bytes
const formatSize = (bytes?: number): string => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

// Cargar datos iniciales
onMounted(async () => {
  await loadAll()
})

const loadAll = async () => {
  refreshing.value = true
  try {
    await Promise.all([fetchStats(), fetchHealth()])
  } catch (e) {
    console.error('Error loading cache data:', e)
  } finally {
    refreshing.value = false
  }
}

const handleRefresh = async () => {
  await loadAll()
}

const handleSearchKeys = async () => {
  if (!searchPattern.value.trim()) return
  searching.value = true
  try {
    await fetchKeys(searchPattern.value.trim())
  } catch (e) {
    console.error('Error searching keys:', e)
  } finally {
    searching.value = false
  }
}

const handleInvalidate = async () => {
  if (!invalidatePattern.value.trim()) return
  invalidating.value = true
  try {
    await invalidateCache(invalidatePattern.value.trim())
    invalidatePattern.value = ''
    // Recargar stats tras invalidar
    await fetchStats()
  } catch (e) {
    console.error('Error invalidating cache:', e)
  } finally {
    invalidating.value = false
  }
}

const handleFlush = async () => {
  flushing.value = true
  try {
    await flushCache()
    showFlushDialog.value = false
    // Recargar stats y keys tras flush
    await Promise.all([fetchStats(), fetchHealth()])
    keys.value = []
    keysTotal.value = 0
  } catch (e) {
    console.error('Error flushing cache:', e)
  } finally {
    flushing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Cache Redis</h1>
        <p class="text-xs text-muted-foreground">Monitoreo y gestion del cache de la plataforma</p>
      </div>
      <Button variant="outline" @click="handleRefresh" :disabled="refreshing">
        <RefreshCwIcon v-if="!refreshing" class="h-4 w-4 mr-2" />
        <Loader2Icon v-else class="h-4 w-4 mr-2 animate-spin" />
        Actualizar
      </Button>
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

    <!-- Loading -->
    <div v-if="loading && !stats && !health" class="flex items-center justify-center py-12">
      <Loader2Icon class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Health Card -->
    <Card v-if="health" :class="healthBgColor">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Estado del Cache</CardTitle>
        <HeartPulseIcon class="h-4 w-4" :class="healthStatusColor" />
      </CardHeader>
      <CardContent>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Estado:</span>
            <Badge
              :variant="healthStatusVariant"
              :class="{
                'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400': health.status === 'healthy',
                'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400': health.status === 'degraded',
                'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400': health.status === 'down',
              }"
            >
              {{ health.status === 'healthy' ? 'Saludable' : health.status === 'degraded' ? 'Degradado' : 'Caido' }}
            </Badge>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Latencia:</span>
            <span class="text-sm font-medium">{{ health.latency }}ms</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Version:</span>
            <span class="text-sm font-mono">{{ health.version }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Conectado:</span>
            <Badge :variant="health.connected ? 'default' : 'destructive'">
              {{ health.connected ? 'Si' : 'No' }}
            </Badge>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Modo:</span>
            <span class="text-sm font-mono">{{ health.mode }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Stats Cards - Principales -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Keys</CardTitle>
          <KeyIcon class="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ (stats.totalKeys ?? 0).toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">Keys almacenadas en cache</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Memoria Usada</CardTitle>
          <HardDriveIcon class="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.usedMemory }}</div>
          <p class="text-xs text-muted-foreground">Memoria actual del servidor</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Hit Rate</CardTitle>
          <ZapIcon class="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold" :class="(stats.hitRate ?? 0) >= 80 ? 'text-green-600' : (stats.hitRate ?? 0) >= 50 ? 'text-amber-600' : 'text-red-600'">
            {{ (stats.hitRate ?? 0).toFixed(1) }}%
          </div>
          <p class="text-xs text-muted-foreground">Miss rate: {{ (stats.missRate ?? 0).toFixed(1) }}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Uptime</CardTitle>
          <ClockIcon class="h-4 w-4 text-cyan-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatUptime(stats.uptimeInSeconds) }}</div>
          <p class="text-xs text-muted-foreground">Tiempo de actividad</p>
        </CardContent>
      </Card>
    </div>

    <!-- Stats Cards - Adicionales -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Memoria Pico</CardTitle>
          <MemoryStickIcon class="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.usedMemoryPeak }}</div>
          <p class="text-xs text-muted-foreground">Pico maximo de memoria</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Clientes Conectados</CardTitle>
          <UsersIcon class="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.connectedClients }}</div>
          <p class="text-xs text-muted-foreground">Conexiones activas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Keys Evicted</CardTitle>
          <ActivityIcon class="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ (stats.evictedKeys ?? 0).toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">Keys desalojadas por memoria</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Keys Expired</CardTitle>
          <ClockIcon class="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ (stats.expiredKeys ?? 0).toLocaleString() }}</div>
          <p class="text-xs text-muted-foreground">Keys expiradas automaticamente</p>
        </CardContent>
      </Card>
    </div>

    <!-- Key Browser -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <DatabaseIcon class="h-5 w-5 text-blue-500" />
          Explorador de Keys
        </CardTitle>
        <CardDescription>Buscar keys en el cache por patron (ej: user:*, session:*, product:*)</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex gap-2">
          <Input
            v-model="searchPattern"
            placeholder="Patron de busqueda (ej: *)"
            class="flex-1"
            @keyup.enter="handleSearchKeys"
          />
          <Button @click="handleSearchKeys" :disabled="searching || !searchPattern.trim()">
            <SearchIcon v-if="!searching" class="h-4 w-4 mr-2" />
            <Loader2Icon v-else class="h-4 w-4 mr-2 animate-spin" />
            Buscar
          </Button>
        </div>

        <div v-if="keysTotal > 0" class="text-sm text-muted-foreground">
          {{ keysTotal }} key(s) encontrada(s)
        </div>

        <div v-if="keys.length > 0" class="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[45%]">Key</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead>Tamano</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="cacheKey in keys" :key="cacheKey.key">
                <TableCell class="font-mono text-xs break-all">{{ cacheKey.key }}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{{ cacheKey.type }}</Badge>
                </TableCell>
                <TableCell class="text-sm">{{ formatTtl(cacheKey.ttl) }}</TableCell>
                <TableCell class="text-sm">{{ formatSize(cacheKey.size) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div v-else-if="keysTotal === 0 && !searching && keys.length === 0" class="text-center py-6 text-muted-foreground">
          <DatabaseIcon class="h-8 w-8 mx-auto mb-2" />
          <p class="text-sm">Ingresa un patron y haz clic en buscar para explorar las keys</p>
        </div>
      </CardContent>
    </Card>

    <!-- Acciones -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <ZapIcon class="h-5 w-5 text-orange-500" />
          Acciones de Cache
        </CardTitle>
        <CardDescription>Invalidar keys por patron o limpiar todo el cache</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Invalidar por patron -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Invalidar por patron</label>
          <div class="flex gap-2">
            <Input
              v-model="invalidatePattern"
              placeholder="Patron a invalidar (ej: user:*, session:*)"
              class="flex-1"
              @keyup.enter="handleInvalidate"
            />
            <Button
              variant="outline"
              @click="handleInvalidate"
              :disabled="invalidating || !invalidatePattern.trim()"
            >
              <Trash2Icon v-if="!invalidating" class="h-4 w-4 mr-2" />
              <Loader2Icon v-else class="h-4 w-4 mr-2 animate-spin" />
              Invalidar
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">Elimina todas las keys que coincidan con el patron especificado</p>
        </div>

        <!-- Flush all -->
        <div class="space-y-2 pt-4 border-t">
          <label class="text-sm font-medium text-destructive">Limpiar todo el cache</label>
          <div>
            <Button variant="destructive" @click="showFlushDialog = true" :disabled="flushing">
              <Trash2Icon v-if="!flushing" class="h-4 w-4 mr-2" />
              <Loader2Icon v-else class="h-4 w-4 mr-2 animate-spin" />
              Flush All Cache
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">Elimina TODAS las keys del cache. Esta accion no se puede deshacer.</p>
        </div>
      </CardContent>
    </Card>

    <!-- Flush Confirmation Dialog -->
    <AlertDialog v-model:open="showFlushDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpiar todo el cache</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion eliminara TODAS las keys almacenadas en el cache Redis.
            Esto puede afectar temporalmente el rendimiento de la plataforma mientras
            se reconstruye el cache. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="flushing">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click.prevent="handleFlush"
            :disabled="flushing"
          >
            <Loader2Icon v-if="flushing" class="h-4 w-4 mr-2 animate-spin" />
            Si, limpiar todo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
