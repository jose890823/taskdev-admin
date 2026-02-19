<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

definePageMeta({
  layout: 'empty',
})

const { verifyEmail, resendOtp, loading, error: authError } = useAuth()
const toast = useToast()
const route = useRoute()

const email = ref((route.query.email as string) || '')
const redirect = (route.query.redirect as string) || ''
const otpCode = ref('')
const verified = ref(false)
const resendCooldown = ref(0)

const handleVerify = async () => {
  if (!otpCode.value || otpCode.value.length !== 6) return

  const success = await verifyEmail({
    email: email.value,
    otpCode: otpCode.value,
  })

  if (success) {
    verified.value = true
    toast.success('Email verificado exitosamente')
  } else {
    toast.error('Error', authError.value || 'Codigo invalido')
  }
}

const handleResend = async () => {
  if (resendCooldown.value > 0) return

  const success = await resendOtp(email.value)
  if (success) {
    toast.success('Nuevo codigo enviado a tu email')
    resendCooldown.value = 60
    const interval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) clearInterval(interval)
    }, 1000)
  } else {
    toast.error('Error', authError.value || 'No se pudo reenviar el codigo')
  }
}

const goToLogin = () => {
  const query: Record<string, string> = {}
  if (redirect) query.redirect = redirect
  navigateTo({ path: '/login', query })
}
</script>

<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-md">
      <Card>
        <CardHeader class="text-center">
          <CardTitle>{{ verified ? 'Email Verificado' : 'Verificar Email' }}</CardTitle>
          <CardDescription>
            {{ verified ? 'Tu cuenta esta lista' : `Ingresa el codigo de 6 digitos enviado a ${email}` }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="verified" class="text-center space-y-4">
            <div class="flex justify-center">
              <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <p class="text-muted-foreground">Ahora puedes iniciar sesion con tu cuenta.</p>
            <Button class="w-full" @click="goToLogin">
              Ir a Iniciar Sesion
            </Button>
          </div>

          <form v-else class="space-y-4" @submit.prevent="handleVerify">
            <div class="space-y-2">
              <Label for="otp">Codigo de verificacion</Label>
              <Input
                id="otp"
                v-model="otpCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="123456"
                class="text-center text-2xl tracking-widest"
                :disabled="loading"
              />
            </div>

            <div v-if="authError" class="text-sm text-red-500 text-center">
              {{ authError }}
            </div>

            <Button type="submit" :disabled="loading || otpCode.length !== 6" class="w-full">
              <svg v-if="loading" class="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Verificar
            </Button>

            <div class="text-center">
              <button
                type="button"
                class="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                :disabled="resendCooldown > 0"
                @click="handleResend"
              >
                {{ resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar codigo' }}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
