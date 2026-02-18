/**
 * Utilidades de fechas SIN conversión de zona horaria
 *
 * IMPORTANTE: Estas funciones parsean las fechas manualmente para evitar
 * que JavaScript convierta las fechas a la zona horaria local del navegador.
 *
 * Todas las fechas se tratan como "hora de la clínica" (Las Vegas) y se
 * muestran exactamente como están guardadas en la base de datos.
 */

// Nombres de meses en español
const MONTH_NAMES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const MONTH_NAMES_SHORT_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
]

// Nombres de días en español
const DAY_NAMES_ES = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
]

const DAY_NAMES_SHORT_ES = [
  'dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'
]

// Nombres en inglés
const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const MONTH_NAMES_SHORT_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const DAY_NAMES_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

const DAY_NAMES_SHORT_EN = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
]

/**
 * Parsea un string de fecha/hora y extrae los componentes SIN conversión de timezone
 * Soporta formatos:
 * - "2025-01-15T09:00:00"
 * - "2025-01-15T09:00:00.000Z"
 * - "2025-01-15T09:00:00+00:00"
 * - "2025-01-15" (solo fecha)
 * - "09:00" o "09:00:00" (solo hora)
 */
export interface ParsedDate {
  year: number
  month: number // 1-12
  day: number
  hours: number
  minutes: number
  seconds: number
  dayOfWeek: number // 0-6 (domingo-sábado)
  isValid: boolean
  hasTime: boolean
  hasDate: boolean
}

export function parseDate(dateString: string | null | undefined): ParsedDate {
  const invalid: ParsedDate = {
    year: 0,
    month: 0,
    day: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    dayOfWeek: 0,
    isValid: false,
    hasTime: false,
    hasDate: false
  }

  if (!dateString) return invalid

  // Intentar parsear datetime completo: "2025-01-15T09:00:00" o con Z o timezone
  const datetimeMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (datetimeMatch) {
    const [, yearStr, monthStr, dayStr, hoursStr, minutesStr, secondsStr] = datetimeMatch
    const year = parseInt(yearStr)
    const month = parseInt(monthStr)
    const day = parseInt(dayStr)
    const hours = parseInt(hoursStr)
    const minutes = parseInt(minutesStr)
    const seconds = secondsStr ? parseInt(secondsStr) : 0

    // Calcular día de la semana usando el algoritmo de Zeller (simplificado)
    const dayOfWeek = calculateDayOfWeek(year, month, day)

    return {
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      dayOfWeek,
      isValid: true,
      hasTime: true,
      hasDate: true
    }
  }

  // Intentar parsear solo fecha: "2025-01-15"
  const dateOnlyMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const [, yearStr, monthStr, dayStr] = dateOnlyMatch
    const year = parseInt(yearStr)
    const month = parseInt(monthStr)
    const day = parseInt(dayStr)
    const dayOfWeek = calculateDayOfWeek(year, month, day)

    return {
      year,
      month,
      day,
      hours: 0,
      minutes: 0,
      seconds: 0,
      dayOfWeek,
      isValid: true,
      hasTime: false,
      hasDate: true
    }
  }

  // Intentar parsear solo hora: "09:00" o "09:00:00"
  const timeOnlyMatch = dateString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (timeOnlyMatch) {
    const [, hoursStr, minutesStr, secondsStr] = timeOnlyMatch
    return {
      year: 0,
      month: 0,
      day: 0,
      hours: parseInt(hoursStr),
      minutes: parseInt(minutesStr),
      seconds: secondsStr ? parseInt(secondsStr) : 0,
      dayOfWeek: 0,
      isValid: true,
      hasTime: true,
      hasDate: false
    }
  }

  return invalid
}

/**
 * Calcula el día de la semana para una fecha dada
 * Retorna 0-6 (domingo-sábado)
 */
function calculateDayOfWeek(year: number, month: number, day: number): number {
  // Usamos Date.UTC para evitar conversiones de timezone
  // Solo queremos el día de la semana, que es el mismo en cualquier timezone
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  return date.getUTCDay()
}

/**
 * Formatea una fecha en formato largo
 * Ejemplo: "miércoles, 15 de enero de 2025"
 */
export function formatDateLong(dateString: string | null | undefined, locale: 'es' | 'en' = 'es'): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return dateString || ''

  const dayNames = locale === 'es' ? DAY_NAMES_ES : DAY_NAMES_EN
  const monthNames = locale === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN

  if (locale === 'es') {
    return `${dayNames[parsed.dayOfWeek]}, ${parsed.day} de ${monthNames[parsed.month - 1]} de ${parsed.year}`
  } else {
    return `${dayNames[parsed.dayOfWeek]}, ${monthNames[parsed.month - 1]} ${parsed.day}, ${parsed.year}`
  }
}

/**
 * Formatea una fecha en formato corto
 * Ejemplo: "15 ene 2025"
 */
export function formatDateShort(dateString: string | null | undefined, locale: 'es' | 'en' = 'es'): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return dateString || ''

  const monthNames = locale === 'es' ? MONTH_NAMES_SHORT_ES : MONTH_NAMES_SHORT_EN

  if (locale === 'es') {
    return `${parsed.day} ${monthNames[parsed.month - 1]} ${parsed.year}`
  } else {
    return `${monthNames[parsed.month - 1]} ${parsed.day}, ${parsed.year}`
  }
}

/**
 * Formatea una fecha en formato medio
 * Ejemplo: "15 de enero de 2025"
 */
export function formatDateMedium(dateString: string | null | undefined, locale: 'es' | 'en' = 'es'): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return dateString || ''

  const monthNames = locale === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN

  if (locale === 'es') {
    return `${parsed.day} de ${monthNames[parsed.month - 1]} de ${parsed.year}`
  } else {
    return `${monthNames[parsed.month - 1]} ${parsed.day}, ${parsed.year}`
  }
}

/**
 * Formatea solo la hora
 * Ejemplo: "9:00 AM" o "09:00"
 */
export function formatTime(dateString: string | null | undefined, format: '12h' | '24h' = '12h'): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasTime) return dateString || ''

  if (format === '24h') {
    return `${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')}`
  }

  // Formato 12h
  const hour12 = parsed.hours % 12 || 12
  const ampm = parsed.hours >= 12 ? 'PM' : 'AM'
  return `${hour12}:${String(parsed.minutes).padStart(2, '0')} ${ampm}`
}

/**
 * Formatea fecha y hora completa
 * Ejemplo: "miércoles, 15 de enero de 2025, 9:00 AM"
 */
export function formatDateTime(dateString: string | null | undefined, locale: 'es' | 'en' = 'es'): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid) return dateString || ''

  if (parsed.hasDate && parsed.hasTime) {
    return `${formatDateLong(dateString, locale)}, ${formatTime(dateString)}`
  } else if (parsed.hasDate) {
    return formatDateLong(dateString, locale)
  } else if (parsed.hasTime) {
    return formatTime(dateString)
  }

  return dateString || ''
}

/**
 * Formatea fecha y hora en formato corto
 * Ejemplo: "15 ene 2025, 9:00 AM"
 */
export function formatDateTimeShort(dateString: string | null | undefined, locale: 'es' | 'en' = 'es'): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid) return dateString || ''

  if (parsed.hasDate && parsed.hasTime) {
    return `${formatDateShort(dateString, locale)}, ${formatTime(dateString)}`
  } else if (parsed.hasDate) {
    return formatDateShort(dateString, locale)
  } else if (parsed.hasTime) {
    return formatTime(dateString)
  }

  return dateString || ''
}

/**
 * Formatea una fecha para mostrar solo día/mes
 * Ejemplo: "15 ene" o "Jan 15"
 */
export function formatDayMonth(dateString: string | null | undefined, locale: 'es' | 'en' = 'es'): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return dateString || ''

  const monthNames = locale === 'es' ? MONTH_NAMES_SHORT_ES : MONTH_NAMES_SHORT_EN

  if (locale === 'es') {
    return `${parsed.day} ${monthNames[parsed.month - 1]}`
  } else {
    return `${monthNames[parsed.month - 1]} ${parsed.day}`
  }
}

/**
 * Obtiene el nombre del día de la semana
 */
export function getDayName(dateString: string | null | undefined, locale: 'es' | 'en' = 'es', short: boolean = false): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return ''

  const dayNames = locale === 'es'
    ? (short ? DAY_NAMES_SHORT_ES : DAY_NAMES_ES)
    : (short ? DAY_NAMES_SHORT_EN : DAY_NAMES_EN)

  return dayNames[parsed.dayOfWeek]
}

/**
 * Obtiene el nombre del mes
 */
export function getMonthName(dateString: string | null | undefined, locale: 'es' | 'en' = 'es', short: boolean = false): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return ''

  const monthNames = locale === 'es'
    ? (short ? MONTH_NAMES_SHORT_ES : MONTH_NAMES_ES)
    : (short ? MONTH_NAMES_SHORT_EN : MONTH_NAMES_EN)

  return monthNames[parsed.month - 1]
}

/**
 * Formatea fecha para input type="date" (YYYY-MM-DD)
 */
export function formatForDateInput(dateString: string | null | undefined): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return ''

  return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`
}

/**
 * Formatea hora para input type="time" (HH:mm)
 */
export function formatForTimeInput(dateString: string | null | undefined): string {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasTime) return ''

  return `${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')}`
}

/**
 * Combina fecha y hora en un string ISO (sin Z al final)
 * Para enviar al backend sin problemas de timezone
 */
export function combineDateTime(date: string, time: string): string {
  const parsedDate = parseDate(date)
  const parsedTime = parseDate(time)

  if (!parsedDate.isValid || !parsedDate.hasDate) return ''
  if (!parsedTime.isValid || !parsedTime.hasTime) return date

  const dateStr = formatForDateInput(date)
  const timeStr = formatForTimeInput(time)

  return `${dateStr}T${timeStr}:00`
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (hora de la clínica - Las Vegas)
 * NOTA: Esta función usa la hora del navegador, idealmente debería obtener
 * la hora del servidor para ser consistente
 */
export function getTodayString(): string {
  // Usamos la hora local del navegador - en producción podría obtenerse del servidor
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(dateString: string | null | undefined): boolean {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return false

  const today = getTodayString()
  const dateOnly = formatForDateInput(dateString)

  return today === dateOnly
}

/**
 * Verifica si una fecha ya pasó
 */
export function isPast(dateString: string | null | undefined): boolean {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return false

  const today = getTodayString()
  const dateOnly = formatForDateInput(dateString)

  return dateOnly < today
}

/**
 * Verifica si una fecha es futura
 */
export function isFuture(dateString: string | null | undefined): boolean {
  const parsed = parseDate(dateString)
  if (!parsed.isValid || !parsed.hasDate) return false

  const today = getTodayString()
  const dateOnly = formatForDateInput(dateString)

  return dateOnly > today
}

// Exportar constantes por si se necesitan
export const MONTHS_ES = MONTH_NAMES_ES
export const MONTHS_SHORT_ES = MONTH_NAMES_SHORT_ES
export const DAYS_ES = DAY_NAMES_ES
export const DAYS_SHORT_ES = DAY_NAMES_SHORT_ES
export const MONTHS_EN = MONTH_NAMES_EN
export const MONTHS_SHORT_EN = MONTH_NAMES_SHORT_EN
export const DAYS_EN = DAY_NAMES_EN
export const DAYS_SHORT_EN = DAY_NAMES_SHORT_EN
