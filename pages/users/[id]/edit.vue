<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { z } from 'zod'
import type { FormFieldConfig } from '~/components/shared/DynamicForm/types'
import type { UpdateUserDto } from '~/modules/users/types'
import { useUsers } from '~/modules/users/composables/useUsers'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { Button } from '~/components/ui/button'
import { useBreadcrumbMeta } from '~/composables/useBreadcrumbMeta'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const route = useRoute()
const userId = computed(() => route.params.id as string)

const { fetchUser, updateUser, currentUser, loading, error, clearError } = useUsers()
const { user: authUser } = useAuth()
const { setMeta, clearMeta } = useBreadcrumbMeta()

const loadingUser = ref(false)

// Schema de validación con Zod (password es opcional en edición)
const validationSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)'
    )
    .optional()
    .or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().regex(
    /^\+?[1-9]\d{1,14}$/,
    'El teléfono debe estar en formato internacional (ej: +17868391882)'
  ),
  roles: z.array(z.enum(['client', 'admin', 'super_admin']))
    .min(1, 'El usuario debe tener al menos un rol'),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
}).refine(
  (data) => {
    // Si se ingresó una contraseña, validar que coincidan
    if (data.password && data.password.length > 0) {
      return data.password === data.confirmPassword
    }
    return true
  },
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  }
)

// Verificar si el usuario actual es super_admin
const isSuperAdmin = computed(() =>
  authUser.value?.roles?.includes('super_admin')
)

// Verificar si el usuario que se está editando es super_admin
const isEditingSuperAdmin = computed(() =>
  currentUser.value?.roles?.includes('super_admin')
)

// Verificar si el usuario actual puede editar a este usuario
const canEdit = computed(() => {
  // Si el usuario a editar es super_admin, solo otro super_admin puede editarlo
  if (isEditingSuperAdmin.value) {
    return isSuperAdmin.value
  }
  return true
})

// Configuración de campos del formulario (reactivo)
const formFields = computed<FormFieldConfig[]>(() => [
  {
    name: 'firstName',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Ingrese el nombre',
  },
  {
    name: 'lastName',
    label: 'Apellido',
    type: 'text',
    placeholder: 'Ingrese el apellido',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'ejemplo@correo.com',
  },
  {
    name: 'phone',
    label: 'Teléfono',
    type: 'text',
    placeholder: '+17868391882',
    description: 'Formato internacional (ej: +17868391882)',
  },
  {
    name: 'password',
    label: 'Nueva Contraseña',
    type: 'password',
    placeholder: '••••••••',
    description: 'Dejar en blanco para mantener la actual. Mínimo 8 caracteres, debe incluir mayúscula, minúscula, número y carácter especial',
    attrs: { autocomplete: 'new-password' },
  },
  {
    name: 'confirmPassword',
    label: 'Confirmar Nueva Contraseña',
    type: 'password',
    placeholder: '••••••••',
    attrs: { autocomplete: 'new-password' },
  },
  {
    name: 'roles',
    label: 'Roles',
    type: 'checkboxGroup',
    options: [
      { value: 'client', label: 'Cliente' },
      { value: 'admin', label: 'Administrador' },
      { value: 'super_admin', label: 'Super Administrador' },
    ],
    description: 'Seleccione los roles del usuario (puede tener múltiples)',
  },
  {
    name: 'isActive',
    label: 'Usuario Activo',
    type: 'switch',
    description: 'Habilitar o deshabilitar el acceso del usuario',
  },
  {
    name: 'emailVerified',
    label: 'Email Verificado',
    type: 'switch',
    description: 'Marcar email como verificado (solo super admin)',
    hidden: !isSuperAdmin.value,
  },
  {
    name: 'phoneVerified',
    label: 'Teléfono Verificado',
    type: 'switch',
    description: 'Marcar teléfono como verificado (solo super admin)',
    hidden: !isSuperAdmin.value,
  },
])

// Valores iniciales (se llenarán al cargar el usuario)
const initialValues = ref({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
  roles: ['client'] as string[],
  isActive: true,
  emailVerified: false,
  phoneVerified: false,
})

// Cargar datos del usuario
onMounted(async () => {
  loadingUser.value = true
  try {
    const user = await fetchUser(userId.value)
    if (user?.systemCode) {
      setMeta(userId.value, { systemCode: user.systemCode, uuid: userId.value, label: `${user.firstName} ${user.lastName}` })
    }
    if (user) {
      // Verificar permisos: si es super_admin y el usuario actual no es super_admin, redirigir
      const userIsSuperAdmin = user.roles?.includes('super_admin')
      const currentUserIsSuperAdmin = authUser.value?.roles?.includes('super_admin')
      if (userIsSuperAdmin && !currentUserIsSuperAdmin) {
        console.warn('No tienes permiso para editar este usuario')
        router.push('/users')
        return
      }

      // Normalizar roles: puede venir como array, string separado por comas, o undefined
      let userRoles: string[] = ['client']
      const rolesValue = user.roles as unknown
      if (rolesValue) {
        if (Array.isArray(rolesValue)) {
          userRoles = rolesValue
        } else if (typeof rolesValue === 'string') {
          userRoles = rolesValue.split(',').filter(Boolean)
        }
      }

      initialValues.value = {
        email: user.email,
        password: '',
        confirmPassword: '',
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles: userRoles,
        isActive: user.isActive,
        emailVerified: user.emailVerified || false,
        phoneVerified: user.phoneVerified || false,
      }

    }
  } catch (e) {
    console.error('Error loading user:', e)
  } finally {
    loadingUser.value = false
  }
})

// Manejar envío del formulario
const handleSubmit = async (values: any) => {
  clearError()

  try {
    // Preparar datos para actualizar
    const { confirmPassword, password, ...userData } = values

    // Solo incluir password si se ingresó uno nuevo
    const updateData: UpdateUserDto = {
      ...userData,
      ...(password && password.length > 0 ? { password } : {}),
    }

    const updatedUser = await updateUser(userId.value, updateData)

    if (updatedUser) {
      // Redirigir a la lista de usuarios
      router.push('/users')
    }
  } catch (e) {
    console.error('Error updating user:', e)
  }
}

// Cancelar y volver a la lista
const handleCancel = () => {
  router.push('/users')
}

// Volver a la lista
const goBack = () => {
  router.push('/users')
}

onUnmounted(() => clearMeta())
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">Editar Usuario</h1>
          <p class="text-muted-foreground text-sm mt-1">
            <span v-if="currentUser">
              {{ currentUser.firstName }} {{ currentUser.lastName }} - {{ currentUser.email }}
            </span>
            <span v-else>Cargando...</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          @click="goBack"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver
        </Button>
      </div>
    </div>

    <!-- Mensaje de error -->
    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="loadingUser" class="flex items-center justify-center py-12">
      <div class="text-center space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p class="text-muted-foreground">Cargando usuario...</p>
      </div>
    </div>

    <!-- Formulario -->
    <div v-else class="rounded-lg border p-6">
      <DynamicForm
        v-if="currentUser && initialValues.email"
        :key="`form-${userId}-${Date.now()}`"
        :fields="formFields"
        :validation-schema="validationSchema"
        :initial-values="{ ...initialValues }"
        :loading="loading"
        :columns="2"
        submit-text="Actualizar Usuario"
        cancel-text="Cancelar"
        :show-cancel="true"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
      <div v-else-if="!currentUser" class="text-center py-8 text-muted-foreground">
        No se pudo cargar el usuario
      </div>
    </div>
  </div>
</template>
