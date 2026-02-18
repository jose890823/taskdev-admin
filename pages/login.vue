<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '~/modules/auth/composables/useAuth'
import LoginForm from '~/components/auth/LoginForm.vue'

const { isAuthenticated } = useAuth()

// Si ya está autenticado, redirigir al inicio
onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo('/')
  }
})

// Desactivar layout para esta página (login sin sidebar)
definePageMeta({
  layout: 'empty',
})
</script>

<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm md:max-w-4xl">
      <LoginForm />
    </div>
  </div>
</template>
