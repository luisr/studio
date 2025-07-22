// src/lib/constants.ts

// Application constants
export const APP_NAME = 'Tô de Olho!'
export const APP_DESCRIPTION = 'Gerenciamento de Projetos com Inteligência Preditiva e Transparência'

// Default values
export const DEFAULT_PASSWORD = 'BeachPark@2025'
export const DEFAULT_AVATAR = 'https://placehold.co/100x100.png'

// Conversion factors for effort units
export const EFFORT_CONVERSION_FACTORS = {
  hours: 1,
  days: 8,
  weeks: 40,
  months: 160,
} as const

// Priority order for sorting
export const PRIORITY_ORDER = {
  'Alta': 1,
  'Média': 2,
  'Baixa': 3,
} as const

// Priority CSS classes
export const PRIORITY_CLASSES = {
  'Alta': 'bg-red-500/20 text-red-700',
  'Média': 'bg-yellow-500/20 text-yellow-700',
  'Baixa': 'bg-blue-500/20 text-blue-700',
} as const

// Chart colors
export const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
} as const

// Date formats
export const DATE_FORMATS = {
  display: 'dd/MM/yyyy',
  displayWithTime: 'dd/MM/yyyy HH:mm',
  iso: 'yyyy-MM-dd',
} as const

// Validation constants
export const VALIDATION = {
  minNameLength: 2,
  minPasswordLength: 8,
  maxFileSize: 10 * 1024 * 1024, // 10MB
} as const