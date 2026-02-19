<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'

const props = withDefaults(defineProps<{
  redirect?: string
}>(), {
  redirect: '',
})

const { login, loading, error: authError } = useAuth()
const { success, error } = useToast()

// Form state
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const validationErrors = ref<{ email?: string; password?: string }>({})

// Validar email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validar formulario
const validateForm = (): boolean => {
  validationErrors.value = {}

  if (!email.value) {
    validationErrors.value.email = 'El email es requerido'
  } else if (!validateEmail(email.value)) {
    validationErrors.value.email = 'Email inválido'
  }

  if (!password.value) {
    validationErrors.value.password = 'La contraseña es requerida'
  } else if (password.value.length < 6) {
    validationErrors.value.password = 'La contraseña debe tener al menos 6 caracteres'
  }

  return Object.keys(validationErrors.value).length === 0
}

// Submit del formulario
const handleSubmit = async () => {
  if (!validateForm()) return

  const success = await login({
    email: email.value,
    password: password.value,
  })

  if (success) {
    // Verificar si hay invitacion pendiente en localStorage
    const pendingInvite = import.meta.client ? localStorage.getItem('pending-invite-token') : null
    if (pendingInvite) {
      await navigateTo(`/invite/${pendingInvite}`)
    } else {
      await navigateTo(props.redirect || '/')
    }
  } else {
    error('Error de autenticación', authError.value || 'Credenciales incorrectas')
  }
}

// Toggle password visibility
const togglePassword = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card class="overflow-hidden p-0">
      <CardContent class="grid p-0 md:grid-cols-2">
        <!-- Form Column -->
        <form class="p-6 md:p-8" @submit.prevent="handleSubmit">
          <div class="flex flex-col gap-6">
            <!-- Header -->
            <div class="flex flex-col items-center gap-2 text-center">
              <h1 class="text-2xl font-bold">
                Bienvenido
              </h1>
              <p class="text-muted-foreground text-balance">
                Sign in to TaskHub
              </p>
            </div>

            <!-- Email Field -->
            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="admin@taskhub.com"
                :disabled="loading"
                :class="{ 'border-red-500': validationErrors.email }"
                @blur="validateForm"
              />
              <p v-if="validationErrors.email" class="text-sm text-red-500">
                {{ validationErrors.email }}
              </p>
            </div>

            <!-- Password Field -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label for="password">Contraseña</Label>
                <a
                  href="#"
                  class="text-sm underline-offset-2 hover:underline"
                  @click.prevent="() => {}"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :disabled="loading"
                  :class="{ 'border-red-500': validationErrors.password }"
                  @blur="validateForm"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  @click="togglePassword"
                >
                  <svg
                    v-if="!showPassword"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                </button>
              </div>
              <p v-if="validationErrors.password" class="text-sm text-red-500">
                {{ validationErrors.password }}
              </p>
            </div>

            <!-- Error Message -->
            <div v-if="authError" class="text-sm text-red-500 text-center">
              {{ authError }}
            </div>

            <!-- Submit Button -->
            <Button type="submit" :disabled="loading" class="w-full">
              <svg
                v-if="loading"
                class="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
            </Button>

            <!-- TODO: Implementar login social en el futuro -->
            <!-- Separator -->
            <!-- <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-card px-2 text-muted-foreground">
                  O continuar con
                </span>
              </div>
            </div> -->

            <!-- Social Login Buttons -->
            <!-- <div class="grid grid-cols-3 gap-4">
              <Button variant="outline" type="button" :disabled="loading">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                <span class="sr-only">Login with Apple</span>
              </Button>
              <Button variant="outline" type="button" :disabled="loading">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                <span class="sr-only">Login with Google</span>
              </Button>
              <Button variant="outline" type="button" :disabled="loading">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4">
                  <path
                    d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                    fill="currentColor"
                  />
                </svg>
                <span class="sr-only">Login with Meta</span>
              </Button>
            </div> -->

            <!-- Sign Up Link -->
            <p class="text-center text-sm text-muted-foreground">
              No tienes cuenta?
              <NuxtLink
                :to="redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'"
                class="underline underline-offset-4 hover:text-primary"
              >
                Registrate
              </NuxtLink>
            </p>
          </div>
        </form>

        <!-- Image Column (Hidden on mobile) -->
        <div class="bg-muted relative hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80"
            alt="TaskHub"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          >
        </div>
      </CardContent>
    </Card>

    <!-- Terms -->
    <p class="px-6 text-center text-xs text-muted-foreground">
      Al continuar, aceptas nuestros
      <a href="#" class="underline underline-offset-4 hover:text-primary">
        Términos de Servicio
      </a>
      y
      <a href="#" class="underline underline-offset-4 hover:text-primary">
        Política de Privacidad
      </a>.
    </p>
  </div>
</template>
