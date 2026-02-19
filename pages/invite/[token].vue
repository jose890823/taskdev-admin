<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { useAuth } from '~/modules/auth/composables/useAuth'

definePageMeta({
  layout: 'empty',
})

const route = useRoute()
const token = route.params.token as string
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl as string
const { isAuthenticated, accessToken, user, logout } = useAuth()

const status = ref<'loading' | 'info' | 'wrong-account' | 'accepting' | 'success' | 'error'>('loading')
const message = ref('')
const inviteInfo = ref<{
  email: string
  organizationName: string
  role: string
  status: string
  expired: boolean
  projectName?: string
  projectRole?: string
} | null>(null)

const isProjectInvite = computed(() => !!inviteInfo.value?.projectName)

const roleLabels: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  member: 'Miembro',
  viewer: 'Observador',
}

onMounted(async () => {
  // Guardar token en localStorage para recuperarlo despues del login
  if (import.meta.client) {
    localStorage.setItem('pending-invite-token', token)
  }

  // 1. Obtener info de la invitacion (publico)
  try {
    const res = await $fetch<{ success: boolean; data: any }>(`${apiUrl}/invitations/info/${token}`)
    inviteInfo.value = res.data
  } catch (e: any) {
    status.value = 'error'
    message.value = 'Invitacion no encontrada o invalida'
    return
  }

  // 2. Verificar si la invitacion esta expirada o ya usada
  if (inviteInfo.value?.expired || inviteInfo.value?.status !== 'pending') {
    status.value = 'error'
    message.value = inviteInfo.value?.status === 'accepted'
      ? 'Esta invitacion ya fue aceptada'
      : 'Esta invitacion ha expirado'
    return
  }

  // 3. Si el usuario esta logueado, verificar que el email coincida
  if (isAuthenticated.value) {
    if (user.value?.email === inviteInfo.value?.email) {
      await acceptInvitation()
      return
    }
    // Email no coincide: mostrar info con opcion de cerrar sesion
    status.value = 'wrong-account'
    return
  }

  // 4. No esta logueado, mostrar info con opciones
  status.value = 'info'
})

const acceptInvitation = async () => {
  status.value = 'accepting'
  try {
    await $fetch(`${apiUrl}/invitations/accept/${token}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken.value}` },
    })
    // Limpiar token pendiente
    if (import.meta.client) {
      localStorage.removeItem('pending-invite-token')
    }
    status.value = 'success'
    message.value = inviteInfo.value?.projectName
      ? `Te has unido al proyecto ${inviteInfo.value.projectName} exitosamente`
      : `Te has unido a ${inviteInfo.value?.organizationName} exitosamente`
  } catch (e: any) {
    status.value = 'error'
    message.value = e.data?.error?.message || 'Error al aceptar la invitacion'
  }
}

const redirectPath = `/invite/${token}`

const goToLogin = () => {
  navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`)
}

const switchAccount = async () => {
  await logout()
  navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`)
}

const goToRegister = () => {
  const email = inviteInfo.value?.email || ''
  navigateTo(`/register?redirect=${encodeURIComponent(redirectPath)}&email=${encodeURIComponent(email)}`)
}
</script>

<template>
  <div class="bg-muted min-h-screen flex items-center justify-center p-6">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">Invitacion</CardTitle>
        <CardDescription>TaskHub</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Loading -->
        <div v-if="status === 'loading' || status === 'accepting'" class="text-center py-4">
          <div class="flex justify-center mb-3">
            <svg class="h-8 w-8 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <p class="text-muted-foreground">
            {{ status === 'accepting' ? 'Aceptando invitacion...' : 'Cargando...' }}
          </p>
        </div>

        <!-- Info: show invite details + login/register -->
        <div v-else-if="status === 'info' && inviteInfo" class="space-y-5">
          <div class="bg-muted/50 border rounded-lg p-4 space-y-2 text-center">
            <p class="text-sm text-muted-foreground">Has sido invitado a</p>
            <template v-if="isProjectInvite">
              <p class="text-xl font-semibold">{{ inviteInfo.projectName }}</p>
              <p class="text-sm text-muted-foreground">en {{ inviteInfo.organizationName }}</p>
              <Badge variant="secondary">{{ roleLabels[inviteInfo.projectRole || 'member'] || inviteInfo.projectRole }}</Badge>
            </template>
            <template v-else>
              <p class="text-xl font-semibold">{{ inviteInfo.organizationName }}</p>
              <Badge variant="secondary">{{ roleLabels[inviteInfo.role] || inviteInfo.role }}</Badge>
            </template>
          </div>

          <p class="text-sm text-muted-foreground text-center">
            Invitacion para <strong>{{ inviteInfo.email }}</strong>
          </p>

          <div class="space-y-2">
            <Button class="w-full" @click="goToLogin">
              Ya tengo cuenta - Iniciar Sesion
            </Button>
            <Button
              variant="outline"
              class="w-full"
              @click="goToRegister"
            >
              No tengo cuenta - Registrarme
            </Button>
          </div>
        </div>

        <!-- Wrong account: logged in with different email -->
        <div v-else-if="status === 'wrong-account' && inviteInfo" class="space-y-5">
          <div class="bg-muted/50 border rounded-lg p-4 space-y-2 text-center">
            <p class="text-sm text-muted-foreground">Has sido invitado a</p>
            <template v-if="isProjectInvite">
              <p class="text-xl font-semibold">{{ inviteInfo.projectName }}</p>
              <p class="text-sm text-muted-foreground">en {{ inviteInfo.organizationName }}</p>
              <Badge variant="secondary">{{ roleLabels[inviteInfo.projectRole || 'member'] || inviteInfo.projectRole }}</Badge>
            </template>
            <template v-else>
              <p class="text-xl font-semibold">{{ inviteInfo.organizationName }}</p>
              <Badge variant="secondary">{{ roleLabels[inviteInfo.role] || inviteInfo.role }}</Badge>
            </template>
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1 text-center">
            <p class="text-sm font-medium text-amber-800">Cuenta incorrecta</p>
            <p class="text-sm text-amber-700">
              Esta invitacion es para <strong>{{ inviteInfo.email }}</strong>, pero estas logueado como <strong>{{ user?.email }}</strong>.
            </p>
          </div>

          <div class="space-y-2">
            <Button class="w-full" @click="switchAccount">
              Cerrar sesion e iniciar con otra cuenta
            </Button>
            <Button variant="outline" class="w-full" @click="navigateTo('/')">
              Volver al inicio
            </Button>
          </div>
        </div>

        <!-- Success -->
        <div v-else-if="status === 'success'" class="text-center space-y-4">
          <div class="flex justify-center">
            <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <p class="text-green-600 font-medium">{{ message }}</p>
          <Button class="w-full" @click="navigateTo(isProjectInvite ? '/projects' : '/organizations')">
            {{ isProjectInvite ? 'Ir a Proyectos' : 'Ir a Organizaciones' }}
          </Button>
        </div>

        <!-- Error -->
        <div v-else-if="status === 'error'" class="text-center space-y-4">
          <div class="flex justify-center">
            <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-600"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
            </div>
          </div>
          <p class="text-destructive font-medium">{{ message }}</p>
          <Button variant="outline" class="w-full" @click="navigateTo('/login')">
            Ir al login
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
