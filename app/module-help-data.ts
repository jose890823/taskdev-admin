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
        description: 'Las organizaciones agrupan equipos de trabajo. Cada una tiene sus propios proyectos, tareas y miembros.',
        items: [
          'Cada organizacion tiene un codigo unico auto-generado (ORG-YYMMDD-XXXX).',
          'El creador de la organizacion recibe automaticamente el rol de owner.',
          'Los datos de proyectos, tareas y miembros estan aislados por organizacion.',
          'Puedes ver y gestionar todas las organizaciones del sistema.',
        ],
      },
      {
        title: 'Roles de miembros',
        icon: 'shield',
        color: 'purple',
        description: 'Cada miembro de una organizacion tiene un rol que define sus permisos.',
        items: [
          'Owner: Control total — gestiona proyectos, miembros e invitaciones.',
          'Admin: Puede gestionar proyectos y miembros, pero no puede eliminar la organizacion.',
          'Member: Accede a los proyectos donde esta asignado y sus tareas.',
        ],
      },
      {
        title: 'Invitaciones',
        icon: 'users',
        color: 'green',
        items: [
          'Se invita por email con un rol asignado (admin o member).',
          'La invitacion genera un link unico con token y expiracion de 7 dias.',
          'Si el invitado no tiene cuenta, puede registrarse desde el link de invitacion.',
          'Las invitaciones pendientes se pueden cancelar o reenviar.',
        ],
      },
      {
        title: 'Importante',
        icon: 'alert',
        color: 'orange',
        variant: 'warning',
        items: [
          'Solo el owner puede eliminar la organizacion. Al hacerlo, todos los proyectos y tareas asociados dejan de estar accesibles.',
        ],
      },
    ],
    adminExample: {
      title: 'Ejemplo: Crear organizacion con equipo',
      description: 'Maria crea su organizacion "Equipo Alpha" y agrega a su equipo de trabajo.',
      steps: [
        { label: 'Se crea la organizacion', detail: 'Se genera el codigo ORG-260218-A3K7 automaticamente. Maria es owner.', highlight: 'blue' },
        { label: 'Invita a Carlos como admin', detail: 'Carlos recibe un email con link de invitacion. Al aceptar, puede gestionar proyectos.', highlight: 'green' },
        { label: 'Invita a Pedro como member', detail: 'Pedro acepta y puede acceder a los proyectos donde lo asignen.', highlight: 'blue' },
        { label: 'Crean un proyecto', detail: 'Carlos crea "Rediseno Web" dentro de la organizacion y asigna a Pedro.', highlight: 'green' },
      ],
    },
    clientSections: [
      {
        title: 'Tus organizaciones',
        icon: 'building',
        color: 'blue',
        description: 'Aqui ves todas las organizaciones a las que perteneces.',
        items: [
          'Crear nuevas organizaciones donde tu seras el owner.',
          'Ver las organizaciones donde te han invitado como miembro.',
          'Acceder a los proyectos y tareas de cada organizacion.',
        ],
      },
      {
        title: 'Miembros e invitaciones',
        icon: 'users',
        color: 'green',
        items: [
          'Si eres owner o admin, puedes invitar personas por email.',
          'Los invitados reciben un link para unirse a la organizacion.',
          'Puedes ver y gestionar los miembros de tus organizaciones.',
        ],
      },
    ],
    clientExample: {
      title: 'Ejemplo: Unirte a una organizacion',
      description: 'Te invitaron a una organizacion y quieres ver tus proyectos.',
      steps: [
        { label: 'Recibes la invitacion', detail: 'Te llega un email con un link para unirte a "Equipo Alpha"', highlight: 'blue' },
        { label: 'Aceptas la invitacion', detail: 'Haces clic en el link y quedas como miembro de la organizacion', highlight: 'green' },
        { label: 'Ves tus proyectos', detail: 'En la organizacion aparecen los proyectos donde te asignaron', highlight: 'blue' },
      ],
    },
  },

  projects: {
    title: 'Proyectos',
    adminSections: [
      {
        title: 'Gestion de proyectos',
        icon: 'folder',
        color: 'indigo',
        description: 'Los proyectos organizan el trabajo dentro de una organizacion. Cada proyecto tiene sus propias tareas, estados y miembros.',
        items: [
          'Los proyectos pertenecen a una organizacion o pueden ser personales (sin organizacion).',
          'Cada proyecto genera un slug unico para su URL (ej: rediseno-web).',
          'Al crear un proyecto se generan automaticamente 4 estados de tarea por defecto.',
          'El creador del proyecto puede configurar estados, modulos y miembros.',
        ],
      },
      {
        title: 'Estados de tarea personalizados',
        icon: 'settings',
        color: 'purple',
        description: 'Cada proyecto define sus propios estados para el flujo de tareas.',
        items: [
          'Los estados tienen nombre, color y orden (sortOrder) dentro del tablero.',
          'Puedes crear estados como: Backlog, En progreso, En revision, Completado.',
          'Los estados definen las columnas del tablero Kanban.',
          'Se puede marcar un estado como "completado" para registrar la fecha de finalizacion.',
        ],
      },
      {
        title: 'Tablero Kanban',
        icon: 'layers',
        color: 'cyan',
        items: [
          'Las columnas del tablero representan los estados del proyecto.',
          'Las tareas se pueden arrastrar entre columnas para cambiar su estado.',
          'El tablero muestra asignados, prioridad y subtareas de cada tarea.',
        ],
      },
      {
        title: 'Miembros del proyecto',
        icon: 'users',
        color: 'green',
        items: [
          'Los miembros de la organizacion pueden ser asignados a proyectos especificos.',
          'Solo los miembros del proyecto pueden tener tareas asignadas.',
          'Los miembros ven las tareas del proyecto en su lista y tablero.',
        ],
      },
      {
        title: 'Ten en cuenta',
        icon: 'lightbulb',
        color: 'yellow',
        variant: 'tip',
        items: [
          'Los proyectos personales (sin organizacion) solo son visibles para el creador.',
          'Los modulos dentro de un proyecto sirven para agrupar tareas por area (ej: Frontend, Backend, Diseno).',
        ],
      },
    ],
    adminExample: {
      title: 'Ejemplo: Proyecto con tablero Kanban',
      description: 'Se crea el proyecto "Rediseno Web" con estados personalizados y equipo.',
      steps: [
        { label: 'Se crea el proyecto', detail: 'Slug: rediseno-web | Dentro de la org "Equipo Alpha"', highlight: 'blue' },
        { label: 'Se configuran estados', detail: 'Backlog → En progreso → En revision → Completado', highlight: 'blue' },
        { label: 'Se crean modulos', detail: '"Frontend" y "Backend" para organizar tareas por area', highlight: 'green' },
        { label: 'Se agregan miembros', detail: 'Carlos y Pedro son asignados al proyecto', highlight: 'green' },
        { label: 'Se crean tareas', detail: 'Las tareas aparecen en el tablero Kanban organizadas por estado', highlight: 'blue' },
      ],
    },
    clientSections: [
      {
        title: 'Tus proyectos',
        icon: 'folder',
        color: 'indigo',
        description: 'Aqui ves todos los proyectos donde participas.',
        items: [
          'Crear proyectos personales o dentro de una organizacion.',
          'Ver el tablero Kanban con las tareas por estado.',
          'Filtrar y buscar proyectos por nombre o organizacion.',
        ],
      },
      {
        title: 'Tablero Kanban',
        icon: 'layers',
        color: 'cyan',
        items: [
          'Las columnas representan los estados del proyecto.',
          'Arrastra tareas entre columnas para cambiar su estado.',
          'Haz clic en una tarea para ver su detalle, comentarios y subtareas.',
        ],
      },
    ],
    clientExample: {
      title: 'Ejemplo: Usar el tablero Kanban',
      description: 'Quieres ver y mover tus tareas en el tablero de un proyecto.',
      steps: [
        { label: 'Abres el proyecto', detail: 'Ves el tablero con columnas: Backlog, En progreso, Completado', highlight: 'blue' },
        { label: 'Ves tus tareas', detail: 'Las tareas asignadas a ti aparecen con tu avatar', highlight: 'blue' },
        { label: 'Mueves una tarea', detail: 'Arrastras "Disenar header" de Backlog a En progreso', highlight: 'green' },
        { label: 'Creas una tarea', detail: 'Haces clic en "+" en la columna Backlog y agregas una nueva tarea', highlight: 'green' },
      ],
    },
  },

  tasks: {
    title: 'Tareas',
    adminSections: [
      {
        title: 'Sistema de tareas',
        icon: 'check',
        color: 'indigo',
        description: 'Las tareas representan unidades de trabajo. Pueden ser de proyecto (vinculadas a un proyecto) o diarias (independientes).',
        items: [
          'Cada tarea tiene un codigo auto-generado (TSK-YYMMDD-XXXX).',
          'Las tareas de proyecto se gestionan desde el tablero Kanban.',
          'Las tareas diarias son personales y se organizan por fecha.',
          'Soportan prioridades: baja, media, alta, urgente.',
        ],
      },
      {
        title: 'Asignacion y seguimiento',
        icon: 'users',
        color: 'green',
        items: [
          'Las tareas pueden asignarse a uno o varios miembros del proyecto.',
          'Cada tarea registra quien la creo y cuando.',
          'Al mover una tarea a un estado marcado como "completado", se registra la fecha automaticamente.',
        ],
      },
      {
        title: 'Subtareas',
        icon: 'layers',
        color: 'purple',
        items: [
          'Una tarea puede tener subtareas (relacion padre-hijo recursiva).',
          'Las subtareas heredan el proyecto y se gestionan desde la tarea padre.',
          'Completar todas las subtareas no completa automaticamente la tarea padre.',
        ],
      },
      {
        title: 'Comentarios',
        icon: 'contact',
        color: 'cyan',
        items: [
          'Los miembros del proyecto pueden dejar comentarios en cada tarea.',
          'Los comentarios soportan texto enriquecido (negrita, listas, links).',
          'Se registra autor y fecha de cada comentario.',
        ],
      },
      {
        title: 'Ten en cuenta',
        icon: 'lightbulb',
        color: 'yellow',
        variant: 'tip',
        items: [
          'El estado de la tarea depende de los estados configurados en el proyecto.',
          'Las tareas diarias (type: daily) no pertenecen a ningun proyecto y se organizan por fecha.',
        ],
      },
    ],
    adminExample: {
      title: 'Ejemplo: Flujo completo de una tarea',
      description: 'Se crea una tarea, se asigna, se trabaja con subtareas y se completa.',
      steps: [
        { label: 'Se crea la tarea', detail: 'TSK-260218-H5K3 | "Redisenar pagina de login" | Prioridad: alta', highlight: 'blue' },
        { label: 'Se asigna a Carlos', detail: 'Carlos la ve en su tablero Kanban y en su lista de tareas', highlight: 'blue' },
        { label: 'Se agregan subtareas', detail: '"Disenar mockup", "Implementar HTML", "Agregar validaciones"', highlight: 'green' },
        { label: 'Carlos trabaja', detail: 'Mueve la tarea a "En progreso" y va completando subtareas', highlight: 'green' },
        { label: 'Comentarios', detail: 'Pedro comenta "Se ve bien!" y Carlos responde. Queda registrado.', highlight: 'blue' },
        { label: 'Se completa', detail: 'Carlos mueve la tarea a "Completado". Se registra completedAt automaticamente.', highlight: 'green' },
      ],
    },
    clientSections: [
      {
        title: 'Tus tareas',
        icon: 'check',
        color: 'indigo',
        description: 'Aqui ves todas las tareas que te han asignado o que has creado.',
        items: [
          'Ver tareas organizadas por proyecto y estado.',
          'Filtrar por prioridad, estado o proyecto.',
          'Crear nuevas tareas y asignarlas a miembros del proyecto.',
        ],
      },
      {
        title: 'Detalle de tarea',
        icon: 'layers',
        color: 'cyan',
        items: [
          'Ver y agregar subtareas para dividir el trabajo.',
          'Escribir comentarios para discutir con el equipo.',
          'Cambiar el estado, prioridad y asignados.',
        ],
      },
    ],
    clientExample: {
      title: 'Ejemplo: Trabajar en una tarea',
      description: 'Te asignaron una tarea y quieres avanzar en ella.',
      steps: [
        { label: 'Abres la tarea', detail: 'Ves el titulo, descripcion, prioridad y estado actual', highlight: 'blue' },
        { label: 'Creas subtareas', detail: 'Divides el trabajo en pasos: "Investigar", "Implementar", "Probar"', highlight: 'blue' },
        { label: 'Vas completando', detail: 'Marcas cada subtarea como completada a medida que avanzas', highlight: 'green' },
        { label: 'Comentas el progreso', detail: 'Dejas un comentario para que el equipo sepa como vas', highlight: 'green' },
      ],
    },
  },

  daily: {
    title: 'Tareas Diarias',
    adminSections: [
      {
        title: 'Tareas diarias',
        icon: 'calendar',
        color: 'orange',
        description: 'Las tareas diarias son tareas personales organizadas por fecha. No pertenecen a ningun proyecto.',
        items: [
          'Cada tarea diaria tiene una fecha de vencimiento (dueDate).',
          'Se filtran y agrupan por dia para organizacion personal.',
          'No requieren organizacion ni proyecto — son completamente independientes.',
          'Tienen el mismo sistema de prioridades que las tareas de proyecto.',
        ],
      },
      {
        title: 'Diferencia con tareas de proyecto',
        icon: 'arrows',
        color: 'blue',
        items: [
          'Las tareas diarias son de tipo "daily" (no "project").',
          'No aparecen en tableros Kanban de ningun proyecto.',
          'Son visibles solo para el usuario que las creo.',
          'No se pueden asignar a otros miembros.',
        ],
      },
      {
        title: 'Ten en cuenta',
        icon: 'lightbulb',
        color: 'yellow',
        variant: 'tip',
        items: [
          'Las tareas diarias son ideales para actividades personales, recordatorios y to-do lists.',
          'Puedes navegar entre fechas para planificar dias futuros.',
        ],
      },
    ],
    adminExample: {
      title: 'Ejemplo: Organizacion de un dia de trabajo',
      description: 'Un usuario planifica sus tareas para el dia.',
      steps: [
        { label: 'Crea tareas para hoy', detail: '"Revisar emails", "Preparar presentacion", "Reunion con cliente"', highlight: 'blue' },
        { label: 'Asigna prioridades', detail: 'Reunion → urgente | Presentacion → alta | Emails → media', highlight: 'orange' },
        { label: 'Va completando', detail: 'A medida que avanza el dia, marca cada tarea como completada', highlight: 'green' },
        { label: 'Revisa el dia siguiente', detail: 'Cambia la fecha y planifica las tareas de manana', highlight: 'blue' },
      ],
    },
    clientSections: [
      {
        title: 'Tu agenda diaria',
        icon: 'calendar',
        color: 'orange',
        description: 'Organiza tu dia con tareas personales por fecha.',
        items: [
          'Crear tareas rapidas para el dia actual.',
          'Navegar entre fechas para planificar dias futuros.',
          'Marcar tareas como completadas al terminarlas.',
          'Filtrar por prioridad para enfocarte en lo importante.',
        ],
      },
    ],
    clientExample: {
      title: 'Ejemplo: Planificar tu dia',
      description: 'Quieres organizarte para no olvidar nada importante.',
      steps: [
        { label: 'Creas tus tareas', detail: 'Agregas lo que necesitas hacer hoy con prioridades', highlight: 'blue' },
        { label: 'Trabajas en orden', detail: 'Empiezas por las urgentes y vas bajando de prioridad', highlight: 'orange' },
        { label: 'Marcas completadas', detail: 'Al terminar cada cosa, la marcas y ves tu progreso del dia', highlight: 'green' },
      ],
    },
  },

  notifications: {
    title: 'Notificaciones',
    adminSections: [
      {
        title: 'Sistema de notificaciones',
        icon: 'bell',
        color: 'cyan',
        description: 'Las notificaciones te avisan sobre actividad relevante en tus proyectos y organizaciones.',
        items: [
          'Recibes notificaciones cuando te asignan tareas.',
          'Te avisan cuando alguien comenta en tus tareas.',
          'Notificaciones de invitaciones a organizaciones.',
          'Alertas de cambios de estado en tareas que sigues.',
        ],
      },
      {
        title: 'Gestion de notificaciones',
        icon: 'settings',
        color: 'purple',
        items: [
          'Marcar notificaciones como leidas individualmente o todas a la vez.',
          'Las notificaciones se reciben en tiempo real via WebSocket.',
          'Puedes configurar que tipos de eventos te notifican.',
          'El icono de campana muestra el conteo de notificaciones sin leer.',
        ],
      },
      {
        title: 'Tipos de notificacion',
        icon: 'layers',
        color: 'blue',
        items: [
          'Asignacion de tarea: cuando te asignan o desasignan de una tarea.',
          'Comentario: cuando alguien comenta en una tarea donde participas.',
          'Invitacion: cuando te invitan a una organizacion.',
          'Estado: cuando cambia el estado de una tarea que sigues.',
        ],
      },
    ],
    adminExample: {
      title: 'Ejemplo: Flujo de notificaciones',
      description: 'Carlos trabaja en un proyecto y recibe varias notificaciones durante el dia.',
      steps: [
        { label: 'Le asignan una tarea', detail: 'Recibe: "Maria te asigno la tarea TSK-260218-H5K3: Redisenar login"', highlight: 'blue' },
        { label: 'Pedro comenta', detail: 'Recibe: "Pedro comento en Redisenar login: Se ve bien el mockup!"', highlight: 'blue' },
        { label: 'Cambio de estado', detail: 'Recibe: "Maria movio TSK-260218-B2C3 a En revision"', highlight: 'orange' },
        { label: 'Revisa y marca', detail: 'Abre cada notificacion, lee el contenido y la marca como leida', highlight: 'green' },
      ],
    },
    clientSections: [
      {
        title: 'Tus notificaciones',
        icon: 'bell',
        color: 'cyan',
        description: 'Mantente al dia con la actividad de tus proyectos.',
        items: [
          'Ver notificaciones de tareas asignadas y comentarios.',
          'Marcar como leidas para mantener tu bandeja limpia.',
          'Hacer clic en una notificacion para ir directamente al contenido.',
        ],
      },
    ],
    clientExample: {
      title: 'Ejemplo: Revisar actividad',
      description: 'Entras al sistema y quieres ver que paso mientras no estabas.',
      steps: [
        { label: 'Ves el icono de campana', detail: 'El numero rojo indica cuantas notificaciones sin leer tienes', highlight: 'blue' },
        { label: 'Abres las notificaciones', detail: 'Ves la lista con las mas recientes arriba', highlight: 'blue' },
        { label: 'Actuas', detail: 'Haces clic en una para ir a la tarea o comentario directamente', highlight: 'green' },
      ],
    },
  },
}
