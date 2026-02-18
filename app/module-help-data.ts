/**
 * Datos de ayuda por modulo - TaskHub Admin
 * Contenido en espanol, estructurado para renderizar con Vue (sin HTML)
 */

export interface HelpSection {
  title: string
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink' | 'indigo' | 'yellow' | 'red'
  description?: string
  items: string[]
  variant?: 'default' | 'tip' | 'warning'
}

export interface HelpExample {
  title: string
  description: string
  steps: { label: string; detail: string; highlight?: 'green' | 'orange' | 'blue' | 'red' }[]
}

export interface ExampleTab {
  label: string
  icon: string
  color: 'green' | 'orange' | 'blue' | 'red' | 'cyan' | 'purple'
  description: string
  steps: { label: string; detail: string; highlight?: 'green' | 'orange' | 'blue' | 'red' }[]
}

export interface ModuleHelpContent {
  title: string
  adminSections: HelpSection[]
  adminExample?: HelpExample
  adminExampleTabs?: ExampleTab[]
  clientSections: HelpSection[]
  clientExample?: HelpExample
  clientExampleTabs?: ExampleTab[]
}

export const moduleHelpData: Record<string, ModuleHelpContent> = {
  organizations: {
    title: 'Organizaciones',
    adminSections: [
      {
        title: 'Gestion de organizaciones',
        icon: 'building',
        color: 'blue',
        description: 'Las organizaciones agrupan equipos de trabajo. Cada organizacion tiene miembros con roles.',
        items: [
          'Cada organizacion tiene un slug unico y un codigo de sistema auto-generado.',
          'Al crear una organizacion, el creador se convierte en OWNER automaticamente.',
          'Los miembros pueden tener rol: owner, admin o member.',
        ],
      },
      {
        title: 'Invitaciones',
        icon: 'mail',
        color: 'green',
        items: [
          'Se puede invitar miembros por email con un token que expira en 7 dias.',
          'El invitado acepta la invitacion y se une automaticamente a la organizacion.',
        ],
      },
    ],
    adminExample: {
      title: 'Ejemplo: Crear organizacion y equipo',
      description: 'Maria crea su organizacion "Equipo Desarrollo" e invita a sus companeros.',
      steps: [
        { label: 'Maria crea la organizacion', detail: 'Se genera codigo ORG-260218-X1Y2 y Maria es OWNER', highlight: 'blue' },
        { label: 'Invita a Juan', detail: 'Se envia invitacion por email con token valido 7 dias', highlight: 'blue' },
        { label: 'Juan acepta', detail: 'Juan se une como MEMBER automaticamente', highlight: 'green' },
      ],
    },
    clientSections: [
      {
        title: 'Tus organizaciones',
        icon: 'building',
        color: 'blue',
        description: 'Gestiona tus organizaciones y equipos de trabajo.',
        items: [
          'Ver todas las organizaciones a las que perteneces.',
          'Crear nuevas organizaciones.',
          'Invitar miembros a tu organizacion.',
        ],
      },
    ],
  },

  projects: {
    title: 'Proyectos',
    adminSections: [
      {
        title: 'Gestion de proyectos',
        icon: 'folder',
        color: 'purple',
        description: 'Los proyectos agrupan tareas. Pueden pertenecer a una organizacion o ser personales.',
        items: [
          'Proyectos con organizationId son de equipo, sin organizationId son personales.',
          'Al crear un proyecto se generan automaticamente 4 estados de tarea por defecto.',
          'Los proyectos pueden tener modulos para organizar las tareas.',
        ],
      },
    ],
    adminExample: {
      title: 'Ejemplo: Proyecto con modulos',
      description: 'Se crea el proyecto "App Movil" con modulos de Frontend y Backend.',
      steps: [
        { label: 'Se crea el proyecto', detail: 'Con slug auto-generado y 4 estados default', highlight: 'blue' },
        { label: 'Se crean modulos', detail: 'Frontend (azul) y Backend (verde) para organizar tareas', highlight: 'blue' },
        { label: 'Se agregan miembros', detail: 'El equipo se une y empieza a crear tareas', highlight: 'green' },
      ],
    },
    clientSections: [
      {
        title: 'Tus proyectos',
        icon: 'folder',
        color: 'purple',
        description: 'Crea y gestiona proyectos para organizar tu trabajo.',
        items: [
          'Crear proyectos personales o de organizacion.',
          'Agregar modulos para categorizar tareas.',
          'Gestionar miembros del proyecto.',
        ],
      },
    ],
  },

  tasks: {
    title: 'Tareas',
    adminSections: [
      {
        title: 'Sistema de tareas',
        icon: 'check',
        color: 'indigo',
        description: 'Las tareas pueden ser de proyecto o diarias. Soportan subtareas, estados, prioridades y asignacion.',
        items: [
          'Tipos: project (de un proyecto) y daily (tareas cotidianas por fecha).',
          'Prioridades: low, medium, high, urgent.',
          'Subtareas recursivas via parentId.',
          'Al cambiar a un estado marcado como completado, se registra la fecha.',
        ],
      },
    ],
    adminExample: {
      title: 'Ejemplo: Flujo de tarea',
      description: 'Se crea una tarea en el proyecto y se trabaja hasta completarla.',
      steps: [
        { label: 'Se crea la tarea', detail: 'Se asigna status "Por hacer" automaticamente', highlight: 'blue' },
        { label: 'Se asigna a un miembro', detail: 'Juan empieza a trabajar, cambia a "En progreso"', highlight: 'orange' },
        { label: 'Se completa', detail: 'Juan la pasa a "Completado" y se registra completedAt', highlight: 'green' },
      ],
    },
    clientSections: [
      {
        title: 'Tus tareas',
        icon: 'check',
        color: 'indigo',
        description: 'Gestiona tareas de proyectos y tareas diarias.',
        items: [
          'Crear y asignar tareas con prioridad.',
          'Organizar con subtareas.',
          'Filtrar por estado, proyecto o fecha.',
          'Agregar comentarios a las tareas.',
        ],
      },
    ],
  },
}
