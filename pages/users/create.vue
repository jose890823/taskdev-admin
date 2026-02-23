<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import type { FormFieldConfig } from '~/components/shared/DynamicForm/types'
import type { CreateUserDto } from '~/modules/users/types'
import { useUsers } from '~/modules/users/composables/useUsers'
import { Button } from '~/components/ui/button'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const { createUser, loading, error, clearError } = useUsers()

// Schema de validación con Zod
const validationSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/,
      'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
    ),
  confirmPassword: z.string().min(8, 'Confirme la contraseña'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().regex(
    /^\+?[1-9]\d{1,14}$/,
    'El teléfono debe estar en formato internacional (ej: +17868391882)'
  ),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// Configuración de campos del formulario
const formFields: FormFieldConfig[] = [
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
    label: 'Contraseña',
    type: 'password',
    placeholder: '••••••••',
    description: 'Mínimo 8 caracteres, debe incluir mayúscula, minúscula, número y carácter especial (@$!%*?&)',
  },
  {
    name: 'confirmPassword',
    label: 'Confirmar Contraseña',
    type: 'password',
    placeholder: '••••••••',
  },
]

// Valores iniciales
const initialValues = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phone: '',
}

// Manejar envío del formulario
const handleSubmit = async (values: any) => {
  clearError()

  try {
    // Remover confirmPassword del objeto que se enviará
    // El backend solo acepta: email, password, firstName, lastName, phone
    const { confirmPassword, ...userData } = values

    const newUser = await createUser(userData as CreateUserDto)

    if (newUser) {
      // Redirigir a la lista de usuarios
      router.push('/users')
    }
  } catch (e) {
    console.error('Error creating user:', e)
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
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">Crear Usuario</h1>
          <p class="text-muted-foreground text-sm mt-1">
            Complete el formulario para crear un nuevo usuario
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

    <!-- Formulario -->
    <div class="rounded-lg border p-6">
      <DynamicForm
        :fields="formFields"
        :validation-schema="validationSchema"
        :initial-values="initialValues"
        :loading="loading"
        :columns="2"
        submit-text="Crear Usuario"
        cancel-text="Cancelar"
        :show-cancel="true"
        :white-field-background="false"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
