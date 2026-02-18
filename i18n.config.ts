export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'es',
  messages: {
    en: {
      welcome: 'Welcome',
      app: {
        name: 'TaskHub',
        title: 'Admin Dashboard',
        description: 'TaskHub Administration'
      },
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        actions: 'Actions'
      },
      crud: {
        create: 'Create {resource}',
        edit: 'Edit {resource}',
        delete: 'Delete {resource}',
        list: '{resource} List',
        created: '{resource} created successfully',
        updated: '{resource} updated successfully',
        deleted: '{resource} deleted successfully',
        confirmDelete: 'Are you sure you want to delete this {resource}?'
      },
      validation: {
        required: 'This field is required',
        email: 'Must be a valid email',
        min: 'Minimum {min} characters',
        max: 'Maximum {max} characters'
      }
    },
    es: {
      welcome: 'Bienvenido',
      app: {
        name: 'TaskHub',
        title: 'Panel de Administración',
        description: 'Administracion de TaskHub'
      },
      common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        search: 'Buscar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        confirm: 'Confirmar',
        yes: 'Sí',
        no: 'No',
        actions: 'Acciones'
      },
      crud: {
        create: 'Crear {resource}',
        edit: 'Editar {resource}',
        delete: 'Eliminar {resource}',
        list: 'Lista de {resource}',
        created: '{resource} creado exitosamente',
        updated: '{resource} actualizado exitosamente',
        deleted: '{resource} eliminado exitosamente',
        confirmDelete: '¿Estás seguro de eliminar este {resource}?'
      },
      validation: {
        required: 'Este campo es requerido',
        email: 'Debe ser un email válido',
        min: 'Mínimo {min} caracteres',
        max: 'Máximo {max} caracteres'
      }
    }
  }
}))
