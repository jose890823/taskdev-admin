<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '~/modules/auth/composables/useAuth'
import LoginForm from '~/components/auth/LoginForm.vue'

const { isAuthenticated } = useAuth()
const route = useRoute()
const redirect = (route.query.redirect as string) || ''

// Si ya está autenticado, redirigir
onMounted(() => {
  if (isAuthenticated.value) {
    // Verificar invitacion pendiente en localStorage
    const pendingInvite = import.meta.client ? localStorage.getItem('pending-invite-token') : null
    if (pendingInvite) {
      navigateTo(`/invite/${pendingInvite}`)
    } else {
      navigateTo(redirect || '/')
    }
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
      <LoginForm :redirect="redirect" />
    </div>
  </div>
</template>
