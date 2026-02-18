<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { useAuth } from '~/modules/auth/composables/useAuth'

definePageMeta({
  layout: 'empty',
})

const route = useRoute()
const token = route.params.token as string
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl as string
const { isAuthenticated, accessToken } = useAuth()

const status = ref<'loading' | 'success' | 'error' | 'need-login'>('loading')
const message = ref('')

onMounted(async () => {
  if (!isAuthenticated.value) {
    status.value = 'need-login'
    message.value = 'Debes iniciar sesion para aceptar la invitacion'
    return
  }

  try {
    await $fetch(`${apiUrl}/invitations/accept/${token}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken.value}` },
    })
    status.value = 'success'
    message.value = 'Te has unido a la organizacion exitosamente'
  } catch (e: any) {
    status.value = 'error'
    message.value = e.data?.error?.message || 'Error al aceptar la invitacion'
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle>Invitacion</CardTitle>
        <CardDescription>TaskHub</CardDescription>
      </CardHeader>
      <CardContent class="text-center space-y-4">
        <div v-if="status === 'loading'" class="text-muted-foreground">
          Procesando invitacion...
        </div>
        <div v-else-if="status === 'success'" class="space-y-4">
          <p class="text-green-600 font-medium">{{ message }}</p>
          <Button @click="navigateTo('/login')">Ir al login</Button>
        </div>
        <div v-else-if="status === 'need-login'" class="space-y-4">
          <p class="text-muted-foreground font-medium">{{ message }}</p>
          <Button @click="navigateTo(`/login?redirect=/invite/${token}`)">Iniciar Sesion</Button>
        </div>
        <div v-else class="space-y-4">
          <p class="text-destructive font-medium">{{ message }}</p>
          <Button variant="outline" @click="navigateTo('/login')">Ir al login</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
