<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { useApiKeys } from '~/modules/api-keys/composables/useApiKeys'
import {
  API_KEY_EXPIRY_DAYS,
  API_KEY_SCOPES,
  type ApiKeyExpiryDays,
  type ApiKeyMetadata,
  type ApiKeyScope,
  type ApiKeySecretResult,
  MAX_API_KEY_SCOPES,
} from '~/modules/api-keys/types'
import { useProjects } from '~/modules/projects/composables/useProjects'
import { useUsers } from '~/modules/users/composables/useUsers'
import { formatDateShort } from '~/utils/date'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import PaginationControls from '~/components/shared/PaginationControls.vue'
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

definePageMeta({ middleware: ['auth', 'module-access'], layout: 'sidebar-vertical' })

const { user, isSuperAdmin } = useAuth()
const { apiKeys, pagination, loading, error, fetchApiKeys, fetchApiKey, createApiKey, replaceApiKey, revokeApiKey } = useApiKeys()
const { projects, fetchAll: fetchProjects } = useProjects()
const { users, fetchUsers } = useUsers()

const form = reactive({ name: '', projectId: '', expirationDays: 30 as ApiKeyExpiryDays, scopes: ['tasks:read'] as ApiKeyScope[], ownerId: '' })
const formOpen = ref(false)
const editingKey = ref<ApiKeyMetadata | null>(null)
const inspectedKey = ref<ApiKeyMetadata | null>(null)
const secret = ref<string | null>(null)
const secretOpen = ref(false)
const revokeTarget = ref<ApiKeyMetadata | null>(null)
const formError = ref<string | null>(null)
const actionLoading = ref(false)
const copied = ref(false)

const isFormValid = computed(() => Boolean(
  form.name.trim()
  && form.projectId
  && form.scopes.length >= 1
  && form.scopes.length <= MAX_API_KEY_SCOPES
  && form.scopes.every(scope => API_KEY_SCOPES.includes(scope))
  && API_KEY_EXPIRY_DAYS.includes(form.expirationDays),
))

const statusLabels = { active: 'Activa', expired: 'Expirada', revoked: 'Revocada' } as const
const statusVariants = { active: 'default', expired: 'secondary', revoked: 'destructive' } as const
const areAllScopesSelected = computed(() => (
  form.scopes.length === API_KEY_SCOPES.length
  && API_KEY_SCOPES.every(scope => form.scopes.includes(scope))
))

const safeError = computed(() => formError.value || error.value)
const isEditing = computed(() => Boolean(editingKey.value))

const getProjectLabel = (key: ApiKeyMetadata) => {
  return projects.value.find(project => project.id === key.projectId)?.name || key.project?.name || key.projectId
}

const getOwnerLabel = (key: ApiKeyMetadata) => {
  const localOwner = users.value.find(owner => owner.id === key.ownerId)
    || (user.value?.id === key.ownerId ? user.value : undefined)
  const owner = localOwner || key.owner
  const name = [owner?.firstName, owner?.lastName].filter(Boolean).join(' ').trim()

  return name || owner?.email || key.ownerId
}

onMounted(async () => {
  await Promise.all([fetchApiKeys(), fetchProjects()])
  if (isSuperAdmin.value) await fetchUsers({ limit: 100 })
})

const resetForm = () => {
  form.name = ''
  form.projectId = ''
  form.expirationDays = 30
  form.scopes = ['tasks:read']
  form.ownerId = ''
  editingKey.value = null
  formError.value = null
}

const openCreate = () => {
  resetForm()
  formOpen.value = true
}

const openReplace = (key: ApiKeyMetadata) => {
  editingKey.value = key
  form.name = key.name
  form.projectId = key.projectId || key.project?.id || ''
  form.expirationDays = 30
  form.scopes = [...key.scopes]
  form.ownerId = ''
  formError.value = null
  formOpen.value = true
}

const closeForm = () => {
  formOpen.value = false
  resetForm()
}

const toggleScope = (scope: ApiKeyScope, checked: boolean) => {
  if (checked && !form.scopes.includes(scope)) form.scopes.push(scope)
  if (!checked) form.scopes = form.scopes.filter(value => value !== scope)
}

const selectAllScopes = () => {
  form.scopes = [...API_KEY_SCOPES]
}

const clearScopes = () => {
  form.scopes = []
}

const payload = () => ({
  name: form.name.trim(),
  projectId: form.projectId,
  scopes: [...form.scopes],
  expirationDays: form.expirationDays,
  ...(isSuperAdmin.value && form.ownerId ? { ownerId: form.ownerId } : {}),
})

const showSecret = (result: ApiKeySecretResult) => {
  secret.value = result.secret
  copied.value = false
  secretOpen.value = true
}

const clearSecret = () => {
  secretOpen.value = false
  secret.value = null
  copied.value = false
}

const copySecret = async () => {
  if (!secret.value || !navigator.clipboard) return
  await navigator.clipboard.writeText(secret.value)
  copied.value = true
}

const handleSave = async () => {
  if (!isFormValid.value) return
  actionLoading.value = true
  formError.value = null
  try {
    const result = editingKey.value
      ? await replaceApiKey(editingKey.value.id, payload())
      : await createApiKey(payload())
    closeForm()
    showSecret(result)
  } catch {
    formError.value = error.value || 'La solicitud de la clave API fue rechazada.'
  } finally {
    actionLoading.value = false
  }
}

const inspect = async (key: ApiKeyMetadata) => {
  try {
    inspectedKey.value = await fetchApiKey(key.id)
  } catch {
    inspectedKey.value = null
  }
}

const confirmRevoke = (key: ApiKeyMetadata) => { revokeTarget.value = key }

const handleRevoke = async () => {
  if (!revokeTarget.value) return
  actionLoading.value = true
  formError.value = null
  try {
    await revokeApiKey(revokeTarget.value.id)
    revokeTarget.value = null
  } catch {
    formError.value = error.value || 'No se pudo revocar la clave API.'
  } finally {
    actionLoading.value = false
  }
}

const statusLabel = (key: ApiKeyMetadata) => statusLabels[key.status]

const goToPage = async (page: number) => {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) return
  try {
    await fetchApiKeys({ page, limit: pagination.value.limit })
  } catch {
    // The composable retains the safe error and server-authoritative current page.
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold tracking-tight">Claves API</h1>
        <p class="text-xs text-muted-foreground">Gestiona credenciales vinculadas a proyectos. Los secretos solo se muestran una vez.</p>
      </div>
      <Button size="sm" @click="openCreate">Crear clave API</Button>
    </div>

    <div v-if="safeError" role="alert" class="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-destructive">
      {{ safeError }}
    </div>

    <Card>
      <CardHeader><CardTitle>Claves administradas</CardTitle><CardDescription>Estado y propietario determinados por el servidor.</CardDescription></CardHeader>
      <CardContent>
        <div v-if="loading" class="py-8 text-center text-muted-foreground">Cargando...</div>
        <div v-else-if="apiKeys.length === 0" class="py-8 text-center text-muted-foreground">No se encontraron claves API.</div>
          <div v-else class="space-y-3">
          <article v-for="key in apiKeys" :key="key.id" class="rounded-md border p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="font-medium">{{ key.name }}</h2>
                <p class="text-sm text-muted-foreground">{{ getProjectLabel(key) }} · {{ getOwnerLabel(key) }}</p>
              </div>
              <Badge :variant="statusVariants[key.status]">{{ statusLabel(key) }}</Badge>
            </div>
            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Permisos: {{ key.scopes.join(', ') }}</span>
              <span>Creada: {{ formatDateShort(key.createdAt) }}</span>
              <span>Último uso: {{ key.lastUsedAt ? formatDateShort(key.lastUsedAt) : 'Nunca' }}</span>
              <span>Expira: {{ formatDateShort(key.expiresAt) }}</span>
              <span v-if="key.revokedAt">Revocada: {{ formatDateShort(key.revokedAt) }}</span>
            </div>
            <div class="mt-3 flex gap-2">
              <Button size="sm" variant="outline" :aria-label="`Inspeccionar ${key.id}`" @click="inspect(key)">Inspeccionar</Button>
              <Button v-if="key.status === 'active'" size="sm" variant="outline" @click="openReplace(key)">Reemplazar</Button>
              <Button v-if="key.status === 'active'" size="sm" variant="destructive" @click="confirmRevoke(key)">Revocar</Button>
            </div>
            </article>
          </div>
          <PaginationControls
            v-if="pagination.totalPages > 0 && !loading"
            :pagination="pagination"
            @update:page="goToPage"
          />
        </CardContent>
    </Card>

    <Dialog v-model:open="formOpen">
      <DialogContent>
        <DialogHeader><DialogTitle>{{ isEditing ? 'Reemplazar clave API' : 'Crear clave API' }}</DialogTitle></DialogHeader>
        <form class="space-y-4" @submit.prevent="handleSave">
          <div class="space-y-2"><Label for="api-key-name">Nombre</Label><Input id="api-key-name" v-model="form.name" autocomplete="off" /></div>
          <div class="space-y-2"><Label for="project-id">Proyecto</Label><Select id="project-id" v-model="form.projectId"><SelectTrigger><SelectValue placeholder="Selecciona un proyecto" /></SelectTrigger><SelectContent><SelectItem v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</SelectItem></SelectContent></Select></div>
          <div v-if="isSuperAdmin" class="space-y-2"><Label for="owner-id">Propietario (autorizado por el servidor)</Label><Select id="owner-id" v-model="form.ownerId"><SelectTrigger><SelectValue placeholder="Predeterminado del servidor" /></SelectTrigger><SelectContent><SelectItem v-for="owner in users" :key="owner.id" :value="owner.id">{{ owner.firstName }} {{ owner.lastName }} ({{ owner.email }})</SelectItem></SelectContent></Select></div>
          <div class="space-y-2"><Label for="expiry-days">Expiración</Label><Select id="expiry-days" v-model="form.expirationDays"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="days in API_KEY_EXPIRY_DAYS" :key="days" :value="days">{{ days }} días</SelectItem></SelectContent></Select></div>
          <fieldset class="space-y-2"><div class="flex items-center justify-between gap-2"><legend class="text-sm font-medium">Permisos (scopes)</legend><div class="flex gap-2"><Button type="button" variant="ghost" size="sm" @click="selectAllScopes">{{ areAllScopesSelected ? 'Todos seleccionados' : 'Seleccionar todos' }}</Button><Button type="button" variant="ghost" size="sm" @click="clearScopes">Limpiar</Button></div></div><p class="text-xs text-muted-foreground">Puedes seleccionar de uno a todos los permisos disponibles.</p><label v-for="scope in API_KEY_SCOPES" :key="scope" class="flex items-center gap-2 text-sm"><Checkbox :model-value="form.scopes.includes(scope)" :value="scope" @update:model-value="checked => toggleScope(scope, Boolean(checked))" />{{ scope }}</label></fieldset>
          <DialogDescription>Selecciona un proyecto accesible, de uno a todos los permisos disponibles y una expiración válida.</DialogDescription>
          <DialogFooter><Button type="button" variant="outline" @click="closeForm">Cancelar</Button><Button type="submit" :disabled="!isFormValid || actionLoading">{{ actionLoading ? 'Guardando...' : 'Guardar' }}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

     <Dialog :open="Boolean(inspectedKey)" @update:open="inspectedKey = null">
       <DialogContent v-if="inspectedKey"><DialogHeader><DialogTitle>{{ inspectedKey.name }}</DialogTitle><DialogDescription>Solo metadatos. El secreto no se puede recuperar.</DialogDescription></DialogHeader><div class="space-y-2 text-sm"><p>Propietario: {{ getOwnerLabel(inspectedKey) }}</p><p>Proyecto: {{ getProjectLabel(inspectedKey) }}</p><p>Estado: {{ statusLabel(inspectedKey) }}</p><p>Expira: {{ formatDateShort(inspectedKey.expiresAt) }}</p></div><DialogFooter><Button variant="outline" @click="inspectedKey = null">Cerrar</Button></DialogFooter></DialogContent>
    </Dialog>

    <Dialog :open="secretOpen" @update:open="clearSecret">
       <DialogContent v-if="secret"><DialogHeader><DialogTitle>Copia el secreto de tu clave API</DialogTitle><DialogDescription>Este secreto no volverá a mostrarse después de cerrar este diálogo.</DialogDescription></DialogHeader><code class="block break-all rounded bg-muted p-3 text-sm" data-testid="one-time-secret">{{ secret }}</code><DialogFooter><Button type="button" variant="outline" @click="copySecret">{{ copied ? 'Copiado' : 'Copiar secreto' }}</Button><Button type="button" @click="clearSecret">Cerrar</Button></DialogFooter></DialogContent>
    </Dialog>

     <AlertDialog :open="Boolean(revokeTarget)" @update:open="revokeTarget = null"><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Revocar clave API?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer para {{ revokeTarget?.name }}.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel @click="revokeTarget = null">Cancelar</AlertDialogCancel><AlertDialogAction :disabled="actionLoading" @click="handleRevoke">Revocar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>
</template>
