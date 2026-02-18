<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSecurity } from '~/modules/security/composables/useSecurity'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
  ArrowLeftIcon,
  BanIcon,
  PlusIcon,
  Trash2Icon,
  Loader2Icon,
  XIcon,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'module-access'],
})

const router = useRouter()
const { blockedIps, loading, error, fetchBlockedIps, blockIp, unblockIp, clearError } = useSecurity()

// Block IP dialog
const showBlockDialog = ref(false)
const newIpAddress = ref('')
const newIpReason = ref('')
const newIpPermanent = ref(false)
const newIpDuration = ref(30)
const blocking = ref(false)

// Unblock dialog
const showUnblockDialog = ref(false)
const ipToUnblock = ref('')

onMounted(async () => {
  await fetchBlockedIps()
})

const handleBlockIp = async () => {
  if (!newIpAddress.value || !newIpReason.value) return
  blocking.value = true
  try {
    await blockIp({
      ipAddress: newIpAddress.value,
      reason: newIpReason.value,
      permanent: newIpPermanent.value,
      ...(!newIpPermanent.value && { durationMinutes: newIpDuration.value }),
    })
    showBlockDialog.value = false
    newIpAddress.value = ''
    newIpReason.value = ''
    newIpPermanent.value = false
    newIpDuration.value = 30
  } catch (e) {
    console.error('Error blocking IP:', e)
  } finally {
    blocking.value = false
  }
}

const confirmUnblock = (ip: string) => {
  ipToUnblock.value = ip
  showUnblockDialog.value = true
}

const handleUnblock = async () => {
  try {
    await unblockIp(ipToUnblock.value)
    showUnblockDialog.value = false
  } catch (e) {
    console.error('Error unblocking IP:', e)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="sm" @click="router.push('/security')">
          <ArrowLeftIcon class="h-4 w-4" />
        </Button>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">IPs Bloqueadas</h1>
          <p class="text-xs text-muted-foreground">Gestiona las direcciones IP bloqueadas</p>
        </div>
      </div>
      <Button @click="showBlockDialog = true">
        <PlusIcon class="h-4 w-4 mr-2" />
        Bloquear IP
      </Button>
    </div>

    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      <div class="flex items-center justify-between">
        <p>{{ error }}</p>
        <Button variant="ghost" size="sm" @click="clearError"><XIcon class="h-4 w-4" /></Button>
      </div>
    </div>

    <Card>
      <CardContent class="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP</TableHead>
              <TableHead>Razón</TableHead>
              <TableHead class="text-center">Tipo</TableHead>
              <TableHead>Bloqueada el</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead class="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell colspan="6" class="text-center py-8">
                <Loader2Icon class="h-6 w-6 animate-spin mx-auto" />
              </TableCell>
            </TableRow>
            <TableRow v-else-if="blockedIps.length === 0">
              <TableCell colspan="6" class="text-center py-8">
                <BanIcon class="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p class="text-muted-foreground">No hay IPs bloqueadas</p>
              </TableCell>
            </TableRow>
            <TableRow v-for="ip in blockedIps" :key="ip.ipAddress">
              <TableCell class="font-mono text-sm">{{ ip.ipAddress }}</TableCell>
              <TableCell class="text-sm max-w-[250px] truncate">{{ ip.reason }}</TableCell>
              <TableCell class="text-center">
                <Badge :variant="ip.permanent ? 'destructive' : 'secondary'" class="text-xs">
                  {{ ip.permanent ? 'Permanente' : 'Temporal' }}
                </Badge>
              </TableCell>
              <TableCell class="text-sm">{{ formatDate(ip.blockedAt) }}</TableCell>
              <TableCell class="text-sm">
                {{ ip.expiresAt ? formatDate(ip.expiresAt) : '-' }}
              </TableCell>
              <TableCell class="text-center">
                <Button variant="ghost" size="sm" @click="confirmUnblock(ip.ipAddress)" title="Desbloquear">
                  <Trash2Icon class="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Block IP Dialog -->
    <Dialog v-model:open="showBlockDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear IP</DialogTitle>
          <DialogDescription>Bloquear una dirección IP para impedir acceso a la plataforma</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Dirección IP *</Label>
            <Input v-model="newIpAddress" placeholder="192.168.1.1" />
          </div>
          <div class="space-y-2">
            <Label>Razón *</Label>
            <Input v-model="newIpReason" placeholder="Motivo del bloqueo" />
          </div>
          <div class="flex items-center gap-2">
            <Switch v-model:checked="newIpPermanent" />
            <Label>Bloqueo permanente</Label>
          </div>
          <div v-if="!newIpPermanent" class="space-y-2">
            <Label>Duración (minutos)</Label>
            <Input v-model.number="newIpDuration" type="number" min="1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showBlockDialog = false">Cancelar</Button>
          <Button variant="destructive" @click="handleBlockIp" :disabled="blocking || !newIpAddress || !newIpReason">
            <Loader2Icon v-if="blocking" class="h-4 w-4 mr-2 animate-spin" />
            Bloquear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Unblock Confirmation -->
    <AlertDialog v-model:open="showUnblockDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desbloquear IP</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de desbloquear la IP {{ ipToUnblock }}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction @click="handleUnblock">Desbloquear</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
