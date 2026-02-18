<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { User } from '~/modules/users/types'
import type { ColumnDef } from '~/components/shared/DataTable/types'
import { useUsers } from '~/modules/users/composables/useUsers'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
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
  PlusIcon,
  SearchIcon,
  XIcon,
  PencilIcon,
  Trash2Icon,
  CheckIcon,
  BanIcon,
  BarChart3Icon,
  ActivityIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const { isSuperAdmin } = useAuth()
const {
  users,
  loading,
  error,
  total,
  page,
  limit,
  fetchUsers,
  deleteUser,
  toggleActive,
  clearError,
} = useUsers()

/**
 * Verifica si el usuario actual puede modificar al usuario dado
 */
const canModifyUser = (user: User): boolean => {
  const hasSuperAdminRole = user.roles?.includes('super_admin')
  if (hasSuperAdminRole) {
    return isSuperAdmin.value
  }
  return true
}

/**
 * Verifica si el usuario puede ser eliminado
 */
const canDeleteUser = (user: User): boolean => {
  if (user.isSystemUser) {
    return false
  }
  return canModifyUser(user)
}

// Estado local
const searchQuery = ref('')
const roleFilter = ref<string>('all')
const statusFilter = ref<string>('all')
const showDeleteDialog = ref(false)
const userToDelete = ref<User | null>(null)
const deleting = ref(false)

// Definir columnas de la tabla
const columns: ColumnDef<User>[] = [
  {
    key: 'firstName',
    label: 'Nombre',
    sortable: true,
    searchable: true,
  },
  {
    key: 'lastName',
    label: 'Apellido',
    sortable: true,
    searchable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    searchable: true,
  },
  {
    key: 'roles',
    label: 'Roles',
    sortable: false,
    align: 'left',
  },
  {
    key: 'isActive',
    label: 'Estado',
    sortable: true,
    align: 'left',
  },
  {
    key: 'actions',
    label: 'Acciones',
    sortable: false,
    align: 'left',
    width: '200px',
  },
]

// Filtrar usuarios según los filtros aplicados
const filteredUsers = computed(() => {
  let filtered = [...users.value]

  if (roleFilter.value !== 'all') {
    filtered = filtered.filter((user) => user.roles?.includes(roleFilter.value as any))
  }

  if (statusFilter.value !== 'all') {
    const isActive = statusFilter.value === 'active'
    filtered = filtered.filter((user) => user.isActive === isActive)
  }

  return filtered
})

// Cargar usuarios al montar el componente
onMounted(async () => {
  await loadUsers()
})

// Cargar usuarios
const loadUsers = async () => {
  try {
    await fetchUsers({
      page: page.value,
      limit: limit.value,
      search: searchQuery.value || undefined,
    })
  } catch (e) {
    console.error('Error loading users:', e)
  }
}

// Manejar cambio de página
const handlePageChange = async (newPage: number) => {
  page.value = newPage
  await loadUsers()
}

// Buscar usuarios
const handleSearch = async () => {
  page.value = 1
  await loadUsers()
}

// Limpiar búsqueda
const clearSearch = async () => {
  searchQuery.value = ''
  page.value = 1
  await loadUsers()
}

// Navegar a crear usuario
const goToCreate = () => {
  router.push('/users/create')
}

// Navegar a editar usuario
const goToEdit = (user: User) => {
  router.push(`/users/${user.id}/edit`)
}

// Navegar a actividad del usuario
const goToActivity = (user: User) => {
  router.push(`/users/${user.id}/activity`)
}

// Mostrar diálogo de confirmación de eliminación
const confirmDelete = (user: User) => {
  userToDelete.value = user
  showDeleteDialog.value = true
}

// Eliminar usuario
const handleDelete = async () => {
  if (!userToDelete.value) return

  deleting.value = true
  try {
    await deleteUser(userToDelete.value.id)
    showDeleteDialog.value = false
    userToDelete.value = null
    await loadUsers()
  } catch (e) {
    console.error('Error deleting user:', e)
  } finally {
    deleting.value = false
  }
}

// Cancelar eliminación
const cancelDelete = () => {
  showDeleteDialog.value = false
  userToDelete.value = null
}

// Toggle activar/desactivar usuario
const handleToggleActive = async (user: User) => {
  try {
    await toggleActive(user.id, !user.isActive)
    await loadUsers()
  } catch (e) {
    console.error('Error toggling user active status:', e)
  }
}

// Obtener variante de badge según el rol
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'destructive'
    case 'owner':
      return 'default'
    case 'employee':
      return 'secondary'
    default:
      return 'outline'
  }
}

// Obtener texto del rol
const getRoleText = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'owner':
      return 'Dueño'
    case 'employee':
      return 'Empleado'
    default:
      return role
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Usuarios</h1>
        <p class="text-xs text-muted-foreground">
          Gestiona los usuarios del sistema
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="() => router.push('/users/stats')">
          <BarChart3Icon class="h-4 w-4 mr-2" />
          Estadísticas
        </Button>
        <Button @click="goToCreate">
          <PlusIcon class="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-card rounded-lg border p-4 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Búsqueda -->
        <div class="md:col-span-2">
          <div class="flex gap-2">
            <Input
              v-model="searchQuery"
              placeholder="Buscar por nombre, email..."
              @keyup.enter="handleSearch"
              class="flex-1"
            />
            <Button @click="handleSearch" :disabled="loading">
              <SearchIcon class="h-4 w-4" />
            </Button>
            <Button
              v-if="searchQuery"
              variant="outline"
              @click="clearSearch"
              :disabled="loading"
            >
              <XIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Filtro por rol -->
        <div>
          <Select v-model="roleFilter">
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="owner">Dueño</SelectItem>
              <SelectItem value="employee">Empleado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Filtro por estado -->
        <div>
          <Select v-model="statusFilter">
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    <!-- Mensaje de error -->
    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError">
          <XIcon class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Tabla de usuarios -->
    <DataTable
      :data="filteredUsers"
      :columns="columns"
      :loading="loading"
      :pagination="{
        page,
        pageSize: limit,
        total,
      }"
      empty-message="No se encontraron usuarios"
      row-key="id"
      @page-change="handlePageChange"
    >
      <!-- Columna de roles -->
      <template #cell-roles="{ row }">
        <div class="flex flex-wrap gap-1">
          <Badge
            v-for="role in (row.roles || [])"
            :key="role"
            :variant="getRoleBadgeVariant(role)"
            class="text-xs"
          >
            {{ getRoleText(role) }}
          </Badge>
        </div>
      </template>

      <!-- Columna de estado -->
      <template #cell-isActive="{ row }">
        <Badge :variant="row.isActive ? 'default' : 'secondary'">
          {{ row.isActive ? 'Activo' : 'Inactivo' }}
        </Badge>
      </template>

      <!-- Columna de acciones -->
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1">
          <!-- Botón de activar/desactivar -->
          <Button
            v-if="canModifyUser(row)"
            :variant="row.isActive ? 'outline' : 'default'"
            size="sm"
            @click="handleToggleActive(row)"
            :title="row.isActive ? 'Desactivar usuario' : 'Activar usuario'"
          >
            <CheckIcon v-if="!row.isActive" class="h-4 w-4" />
            <BanIcon v-else class="h-4 w-4" />
          </Button>

          <!-- Botón de ver actividad -->
          <Button
            variant="outline"
            size="sm"
            @click="goToActivity(row)"
            title="Ver actividad"
          >
            <ActivityIcon class="h-4 w-4" />
          </Button>

          <!-- Botón de editar -->
          <Button
            v-if="canModifyUser(row)"
            variant="outline"
            size="sm"
            @click="goToEdit(row)"
            title="Editar usuario"
          >
            <PencilIcon class="h-4 w-4" />
          </Button>

          <!-- Botón de eliminar -->
          <Button
            v-if="canDeleteUser(row)"
            variant="destructive"
            size="sm"
            @click="confirmDelete(row)"
            title="Eliminar usuario"
          >
            <Trash2Icon class="h-4 w-4" />
          </Button>

          <!-- Indicador de protección -->
          <span
            v-if="row.isSystemUser"
            class="text-xs text-amber-600 font-medium"
            title="Usuario del sistema - No se puede eliminar"
          >
            Sistema
          </span>
          <span
            v-else-if="!canModifyUser(row)"
            class="text-xs text-muted-foreground italic"
            title="Solo Super Admin puede modificar este usuario"
          >
            Protegido
          </span>
        </div>
      </template>
    </DataTable>

    <!-- Diálogo de confirmación de eliminación -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el usuario
            <strong v-if="userToDelete">
              {{ userToDelete.firstName }} {{ userToDelete.lastName }}
            </strong>
            del sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelDelete" :disabled="deleting">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            @click="handleDelete"
            :disabled="deleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {{ deleting ? 'Eliminando...' : 'Eliminar' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
