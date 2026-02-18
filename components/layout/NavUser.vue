<script setup lang="ts">
import { ref } from 'vue'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  User as UserIcon,
} from 'lucide-vue-next'
import { useAuth } from '~/modules/auth/composables/useAuth'
import { useToast } from '~/composables/useToast'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

const { user, logout } = useAuth()
const { success } = useToast()
const { isMobile } = useSidebar()
const loggingOut = ref(false)
const showLogoutDialog = ref(false)

// Generar iniciales del usuario
const userInitials = computed(() => {
  if (!user.value) return 'U'
  const first = user.value.firstName?.[0] || ''
  const last = user.value.lastName?.[0] || ''
  return (first + last).toUpperCase() || 'U'
})

const openLogoutDialog = () => {
  showLogoutDialog.value = true
}

const confirmLogout = async () => {
  showLogoutDialog.value = false
  loggingOut.value = true

  try {
    await logout()
    success('Sesión cerrada', 'Has cerrado sesión exitosamente')
  } catch (error) {
    console.error('Error en logout:', error)
  } finally {
    loggingOut.value = false
  }
}

const cancelLogout = () => {
  showLogoutDialog.value = false
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage
                v-if="user?.profilePhotoUrl"
                :src="user.profilePhotoUrl"
                :alt="user?.firstName + ' ' + user?.lastName"
              />
              <AvatarFallback class="rounded-lg">
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">
                {{ user?.firstName }} {{ user?.lastName }}
              </span>
              <span class="truncate text-xs">{{ user?.email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage
                  v-if="user?.profilePhotoUrl"
                  :src="user.profilePhotoUrl"
                  :alt="user?.firstName + ' ' + user?.lastName"
                />
                <AvatarFallback class="rounded-lg">
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">
                  {{ user?.firstName }} {{ user?.lastName }}
                </span>
                <span class="truncate text-xs">{{ user?.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <NuxtLink to="/profile" class="cursor-pointer">
                <UserIcon class="size-4" />
                Mi Perfil
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BadgeCheck class="size-4" />
              Cuenta
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell class="size-4" />
              Notificaciones
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            :disabled="loggingOut"
            @click="openLogoutDialog"
          >
            <LogOut class="size-4" />
            {{ loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión' }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>

    <!-- Diálogo de confirmación de logout -->
    <Dialog v-model:open="showLogoutDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar Sesión</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="cancelLogout">
            Cancelar
          </Button>
          <Button variant="destructive" @click="confirmLogout" :disabled="loggingOut">
            {{ loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </SidebarMenu>
</template>
