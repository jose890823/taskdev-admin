<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

definePageMeta({
  layout: 'empty',
})

const { isAuthenticated, register, loading, error: authError } = useAuth()
const toast = useToast()
const route = useRoute()
const redirect = (route.query.redirect as string) || ''

onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo(redirect || '/')
  }
})

const email = ref((route.query.email as string) || '')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const phone = ref('')
const showPassword = ref(false)
const validationErrors = ref<Record<string, string>>({})

const validateForm = (): boolean => {
  validationErrors.value = {}

  if (!firstName.value.trim()) {
    validationErrors.value.firstName = 'El nombre es requerido'
  } else if (firstName.value.trim().length < 2) {
    validationErrors.value.firstName = 'Minimo 2 caracteres'
  }

  if (!lastName.value.trim()) {
    validationErrors.value.lastName = 'El apellido es requerido'
  } else if (lastName.value.trim().length < 2) {
    validationErrors.value.lastName = 'Minimo 2 caracteres'
  }

  if (!email.value) {
    validationErrors.value.email = 'El email es requerido'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    validationErrors.value.email = 'Email invalido'
  }

  if (!password.value) {
    validationErrors.value.password = 'La contrasena es requerida'
  } else if (password.value.length < 8) {
    validationErrors.value.password = 'Minimo 8 caracteres'
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])/.test(password.value)) {
    validationErrors.value.password = 'Debe incluir mayuscula, minuscula, numero y caracter especial'
  }

  if (!phone.value) {
    validationErrors.value.phone = 'El telefono es requerido'
  } else if (!/^\+\d{1,14}$/.test(phone.value)) {
    validationErrors.value.phone = 'Formato internacional: +1234567890'
  }

  return Object.keys(validationErrors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  const success = await register({
    email: email.value,
    password: password.value,
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    phone: phone.value,
  })

  if (success) {
    toast.success('Registro exitoso. Revisa tu email para el codigo de verificacion.')
    const query: Record<string, string> = { email: email.value }
    if (redirect) query.redirect = redirect
    await navigateTo({ path: '/verify-email', query })
  } else {
    toast.error('Error', authError.value || 'No se pudo completar el registro')
  }
}
</script>

<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm md:max-w-4xl">
      <div class="flex flex-col gap-6">
        <Card class="overflow-hidden p-0">
          <CardContent class="grid p-0 md:grid-cols-2">
            <form class="p-6 md:p-8" @submit.prevent="handleSubmit">
              <div class="flex flex-col gap-4">
                <div class="flex flex-col items-center gap-2 text-center">
                  <h1 class="text-2xl font-bold">Crear Cuenta</h1>
                  <p class="text-muted-foreground text-balance text-sm">
                    Registrate en TaskHub
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <Label for="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      v-model="firstName"
                      placeholder="Juan"
                      :disabled="loading"
                      :class="{ 'border-red-500': validationErrors.firstName }"
                    />
                    <p v-if="validationErrors.firstName" class="text-xs text-red-500">
                      {{ validationErrors.firstName }}
                    </p>
                  </div>
                  <div class="space-y-1">
                    <Label for="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      v-model="lastName"
                      placeholder="Perez"
                      :disabled="loading"
                      :class="{ 'border-red-500': validationErrors.lastName }"
                    />
                    <p v-if="validationErrors.lastName" class="text-xs text-red-500">
                      {{ validationErrors.lastName }}
                    </p>
                  </div>
                </div>

                <div class="space-y-1">
                  <Label for="email">Email</Label>
                  <Input
                    id="email"
                    v-model="email"
                    type="email"
                    placeholder="tu@email.com"
                    :disabled="loading"
                    :class="{ 'border-red-500': validationErrors.email }"
                  />
                  <p v-if="validationErrors.email" class="text-xs text-red-500">
                    {{ validationErrors.email }}
                  </p>
                </div>

                <div class="space-y-1">
                  <Label for="password">Contrasena</Label>
                  <div class="relative">
                    <Input
                      id="password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Min. 8 caracteres"
                      :disabled="loading"
                      :class="{ 'border-red-500': validationErrors.password }"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      @click="showPassword = !showPassword"
                    >
                      <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                    </button>
                  </div>
                  <p v-if="validationErrors.password" class="text-xs text-red-500">
                    {{ validationErrors.password }}
                  </p>
                </div>

                <div class="space-y-1">
                  <Label for="phone">Telefono</Label>
                  <Input
                    id="phone"
                    v-model="phone"
                    placeholder="+1234567890"
                    :disabled="loading"
                    :class="{ 'border-red-500': validationErrors.phone }"
                  />
                  <p v-if="validationErrors.phone" class="text-xs text-red-500">
                    {{ validationErrors.phone }}
                  </p>
                </div>

                <div v-if="authError" class="text-sm text-red-500 text-center">
                  {{ authError }}
                </div>

                <Button type="submit" :disabled="loading" class="w-full">
                  <svg v-if="loading" class="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {{ loading ? 'Registrando...' : 'Crear Cuenta' }}
                </Button>

                <p class="text-center text-sm text-muted-foreground">
                  Ya tienes cuenta?
                  <NuxtLink
                    :to="redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'"
                    class="underline underline-offset-4 hover:text-primary"
                  >
                    Inicia Sesion
                  </NuxtLink>
                </p>
              </div>
            </form>

            <div class="bg-muted relative hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80"
                alt="TaskHub"
                class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              >
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
