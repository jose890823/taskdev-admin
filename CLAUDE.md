# CLAUDE.md - Admin Dashboard TaskHub (Nuxt 3.20)

Este archivo define las reglas, patrones y convenciones que Claude debe seguir al trabajar con este proyecto admin Nuxt 3.20.

## Comandos de Desarrollo

```bash
pnpm install        # Instalar dependencias
pnpm run dev        # Servidor dev (localhost:3000)
pnpm run build      # Build de produccion
pnpm run test       # Tests con Vitest
pnpm run test:ui    # Tests con UI de Vitest
```

---

## Arquitectura del Proyecto

### Estructura de Carpetas

```
admin/
├── components/           # Componentes Vue reutilizables
│   ├── auth/            # Componentes de autenticacion
│   ├── common/          # Componentes comunes
│   ├── forms/           # Componentes de formularios
│   ├── layout/          # Header, Sidebar, Footer
│   ├── shared/          # DataTable, DynamicForm (componentes avanzados)
│   └── ui/              # shadcn-vue (30+ componentes)
├── composables/         # Composables reutilizables
│   ├── api/            # useFetch (HTTP client)
│   ├── crud/           # useCrud (operaciones CRUD genericas)
│   └── useLayout.ts    # Gestion de layouts
├── modules/            # Modulos por dominio (NO confundir con Nuxt modules)
│   ├── _shared/        # Codigo compartido
│   ├── auth/           # Tipos y composables de auth
│   ├── users/          # Gestion de usuarios
│   ├── organizations/  # Organizaciones + miembros + invitaciones
│   ├── projects/       # Proyectos + miembros + modulos + statuses
│   ├── tasks/          # Tareas (project + daily) + comentarios
│   ├── activity/       # Registro de actividad
│   ├── notifications/  # Notificaciones
│   ├── security/       # Seguridad
│   ├── storage/        # Almacenamiento
│   ├── cache/          # Cache
│   ├── jobs/           # Jobs
│   ├── webhooks/       # Webhooks
│   ├── feature-flags/  # Feature flags
│   └── i18n/           # Traducciones
├── pages/              # File-based routing
│   ├── login.vue
│   ├── index.vue              # Dashboard
│   ├── organizations/
│   │   ├── index.vue          # Lista de organizaciones
│   │   └── [id].vue           # Detalle: miembros + invitaciones
│   ├── projects/
│   │   ├── index.vue          # Lista de proyectos
│   │   └── [slug].vue         # Detalle: modulos, statuses, miembros
│   ├── tasks/
│   │   ├── index.vue          # Mis tareas
│   │   ├── daily.vue          # Tareas diarias por fecha
│   │   └── [id].vue           # Detalle: subtareas, comentarios
│   ├── invite/
│   │   └── [token].vue        # Aceptar invitacion (publica)
│   └── (users, security, storage, cache, jobs, webhooks, feature-flags, i18n, notifications)
├── layouts/            # Layouts (default, empty, sidebar-vertical)
├── middleware/         # auth.ts, module-access.ts
├── plugins/            # auth.client.ts, api.client.ts
├── utils/              # Funciones utilitarias
├── lib/                # Librerias (cn, etc)
├── tests/              # Tests con Vitest
├── i18n/ y locales/    # Internacionalizacion (ES, EN)
└── app/module-config.ts # Configuracion de modulos
```

### Organizacion por Dominio

- **modules/**: Contiene la logica de negocio por dominio
  - Cada modulo tiene: `types/`, `composables/`, `components/` (opcional)
- **components/**: Componentes UI reutilizables
- **composables/**: Logica compartida global

### API Directa

El frontend llama al backend NestJS directamente via `$fetch` con `useRuntimeConfig().public.apiUrl`. No hay server proxy Nitro.

```typescript
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl as string

const data = await $fetch(`${apiUrl}/organizations`, {
  headers: { Authorization: `Bearer ${token}` },
})
```

---

## Convenciones de Naming

### Archivos y Carpetas

| Tipo | Convencion | Ejemplo |
|------|-----------|---------|
| Componentes Vue | PascalCase | `LoginForm.vue`, `DataTable.vue` |
| Pages | kebab-case | `login.vue`, `users/create.vue` |
| Layouts | kebab-case | `default.vue`, `sidebar-vertical.vue` |
| Composables | camelCase, prefijo "use" | `useAuth.ts`, `useTasks.ts` |
| Tipos/Interfaces | PascalCase | `User`, `Task`, `Organization` |
| Archivos de tipo | `types.ts` o `index.ts` | `modules/auth/types/index.ts` |

### Variables y Funciones

```typescript
// Estados reactivos - ref()
const email = ref('')
const isLoading = ref(false)
const tasks = ref<Task[]>([])

// Computed
const isAuthenticated = computed(() => !!user.value)
const pendingTasks = computed(() => tasks.value.filter(t => !t.completedAt))

// Funciones - verbos descriptivos
const fetchMyTasks = async () => {}
const handleSubmit = (event: Event) => {}
const toggleActive = (id: string) => {}

// Props y emits tipados
const props = withDefaults(defineProps<DataTableProps>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': [data: FormData]
}>()
```

---

## Patrones de Codigo

### Componentes Vue - OBLIGATORIO

**SIEMPRE usar `<script setup lang="ts">`** - Nunca Options API

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Task } from '~/modules/tasks/types'

const props = withDefaults(defineProps<{
  task?: Task
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  'submit': [data: Task]
  'cancel': []
}>()

const title = ref('')
const isSubmitting = ref(false)

const isValid = computed(() => title.value.length > 0)

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    emit('submit', { title: title.value })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <Input v-model="title" :disabled="loading" />
    <Button type="submit" :disabled="!isValid || isSubmitting">
      {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
    </Button>
  </form>
</template>
```

---

## Manejo de Estado

### Composables (NO Pinia)

El proyecto **NO usa Pinia**. El estado se maneja con composables y `useCookie()`.

**Patron de useAuth:**
```typescript
export const useAuth = () => {
  const accessTokenCookie = useCookie<string | null>('auth-access-token', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  const userCookie = useCookie<User | null>('auth-user', {
    default: () => null,
  })

  const user = computed({
    get: () => userCookie.value,
    set: (val) => { userCookie.value = val }
  })

  const isAuthenticated = computed(() => !!userCookie.value && !!accessTokenCookie.value)

  const login = async (credentials: LoginDto): Promise<boolean> => {
    const config = useRuntimeConfig()
    const apiUrl = config.public.apiUrl as string
    try {
      const response = await $fetch<AuthResponse>(`${apiUrl}/auth/login`, {
        method: 'POST',
        body: credentials,
      })
      accessTokenCookie.value = response.data.accessToken
      userCookie.value = response.data.user
      return true
    } catch (e: any) {
      error.value = e.data?.error?.message || 'Error al iniciar sesion'
      return false
    }
  }

  return { user, isAuthenticated, login, logout, refreshAccessToken }
}
```

---

## UI con shadcn-vue y Tailwind

### Componentes shadcn-vue Disponibles

Los componentes estan en `components/ui/` y se auto-importan:

```vue
<template>
  <Button variant="default">Primary</Button>
  <Button variant="destructive">Delete</Button>
  <Button variant="outline">Cancel</Button>

  <Input v-model="email" placeholder="Email" />

  <Card>
    <CardHeader>
      <CardTitle>Titulo</CardTitle>
      <CardDescription>Descripcion</CardDescription>
    </CardHeader>
    <CardContent>Contenido</CardContent>
  </Card>

  <Dialog v-model:open="isOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Titulo</DialogTitle>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>
```

### Convenciones Tailwind CSS

```vue
<template>
  <!-- Estructura de pagina -->
  <div class="container mx-auto py-6 space-y-6">

    <!-- Header con titulo y acciones -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Titulo</h1>
        <p class="text-muted-foreground mt-1">Descripcion</p>
      </div>
      <Button>Accion</Button>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
      {{ error }}
    </div>
  </div>
</template>
```

---

## Llamadas a API

### Uso de $fetch con API directa

```typescript
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl as string

// GET
const tasks = await $fetch<Task[]>(`${apiUrl}/tasks/my`, {
  headers: { Authorization: `Bearer ${accessToken.value}` },
})

// POST
const newTask = await $fetch<Task>(`${apiUrl}/tasks`, {
  method: 'POST',
  body: { title, description },
  headers: { Authorization: `Bearer ${accessToken.value}` },
})

// Con query params
const filtered = await $fetch(`${apiUrl}/tasks`, {
  params: { page: 1, limit: 10 },
  headers: { Authorization: `Bearer ${accessToken.value}` },
})
```

### Formato de Respuesta del Backend

```typescript
interface ApiResponse<T> {
  success: true
  data: T
  message: string
  timestamp: string
  path: string
}

interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}
```

---

## Layouts y Paginas

### Definicion de Pagina

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'module-access'],
  layout: 'sidebar-vertical',
})

const { tasks, loading, error, fetchMyTasks } = useTasks()

onMounted(async () => {
  await fetchMyTasks()
})
</script>

<template>
  <div class="container mx-auto py-6 space-y-6">
    <!-- Contenido -->
  </div>
</template>
```

### Layouts Disponibles

- `default.vue` — Layout simple con sidebar
- `sidebar-vertical.vue` — Menu vertical colapsable (glassmorphism)
- `horizontal-menu.vue` — Menu horizontal
- `empty.vue` — Sin layout (login, invitaciones)

---

## Middleware

### auth.ts
Verifica JWT. Redirige a `/login` si no autenticado.

### module-access.ts
Verifica roles por modulo usando `app/module-config.ts`.

---

## Sistema de Modulos

### Configuracion (app/module-config.ts)

```typescript
export const modules: ModuleConfig[] = [
  {
    name: 'organizations',
    enabled: true,
    route: '/organizations',
    icon: 'building-2',
    label: 'Organizaciones',
    allowedRoles: ['super_admin', 'user'],
    group: 'organizacion',
  },
  {
    name: 'projects',
    enabled: true,
    route: '/projects',
    icon: 'folder-kanban',
    label: 'Proyectos',
    allowedRoles: ['super_admin', 'user'],
    group: 'proyecto',
  },
  // ...
]
```

---

## Variables de Entorno

```bash
# Backend API URL
NUXT_PUBLIC_API_URL=http://localhost:3001/api

# Application name
NUXT_PUBLIC_APP_NAME=TaskHub Admin

# Server port
PORT=3000
```

---

## Git Workflow - OBLIGATORIO

### Formato de commits

```
tipo(alcance): descripcion corta

Tipos: feat, fix, refactor, docs, test, chore

Alcances para admin:
- admin: Cambios generales
- organizations: Modulo de organizaciones
- projects: Modulo de proyectos
- tasks: Modulo de tareas
- auth: Autenticacion
- ui: Componentes UI
```

### Reglas obligatorias

- **NUNCA** subir cambios sin que el usuario lo pida explicitamente
- **NUNCA** usar `git push --force` (siempre `--force-with-lease`)
- **NUNCA** commitear archivos `.env`, `node_modules/`, `.nuxt/`, `.output/`

---

## Do's and Don'ts

### Do's

- **Siempre** usar `<script setup lang="ts">` en componentes
- **Siempre** tipar props y emits con interfaces TypeScript
- **Siempre** usar composables para logica de negocio reutilizable
- **Siempre** usar `useCookie()` para tokens (SSR-compatible)
- **Siempre** manejar estados de loading y error en operaciones async
- **Siempre** usar componentes shadcn-vue para UI consistente
- **Siempre** definir `definePageMeta()` con middleware en paginas protegidas
- **Siempre** usar `navigateTo()` para navegacion programatica

### Don'ts

- **NUNCA** usar Options API (solo Composition API con script setup)
- **NUNCA** usar Pinia (usar composables con useState/useCookie)
- **NUNCA** hacer llamadas API directas desde componentes (usar composables)
- **NUNCA** mutar props directamente (usar emit)
- **NUNCA** usar `v-if` y `v-for` en el mismo elemento
- **NUNCA** hardcodear colores (usar CSS variables de Tailwind)
- **NUNCA** ignorar errores en operaciones async
- **NUNCA** usar `console.log` en produccion
