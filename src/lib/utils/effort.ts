// src/lib/utils/effort.ts
import { EFFORT_CONVERSION_FACTORS } from '../constants'

export type EffortUnit = keyof typeof EFFORT_CONVERSION_FACTORS

export const convertEffortToHours = (effort: number, unit: EffortUnit): number => {
  return effort * EFFORT_CONVERSION_FACTORS[unit]
}

export const getBestEffortUnit = (hours: number): { value: number; unit: EffortUnit } => {
  if (hours >= 160) return { value: hours / 160, unit: 'months' }
  if (hours >= 40) return { value: hours / 40, unit: 'weeks' }
  if (hours >= 8) return { value: hours / 8, unit: 'days' }
  return { value: hours, unit: 'hours' }
}

export const formatEffort = (hours: number): string => {
  if (typeof hours !== 'number' || isNaN(hours)) return '-'

  const months = hours / 160
  if (months >= 1 && months % 1 === 0) return `${months} mes${months > 1 ? 'es' : ''}`

  const weeks = hours / 40
  if (weeks >= 1 && weeks % 1 === 0) return `${weeks} sem`

  const days = hours / 8
  if (days >= 1 && days % 1 === 0) return `${days}d`
  
  return `${hours}h`
}