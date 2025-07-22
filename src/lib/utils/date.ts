// src/lib/utils/date.ts
import { format, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DATE_FORMATS } from '../constants'

export const formatDate = (dateString?: string | Date, formatStr: string = DATE_FORMATS.display): string => {
  if (!dateString) return '-'
  
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  
  if (!isValid(date)) return '-'
  
  return format(date, formatStr, { locale: ptBR })
}

export const formatDateWithTime = (dateString?: string | Date): string => {
  return formatDate(dateString, DATE_FORMATS.displayWithTime)
}

export const isValidDateString = (dateString: string): boolean => {
  const date = parseISO(dateString)
  return isValid(date)
}