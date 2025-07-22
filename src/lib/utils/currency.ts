// src/lib/utils/currency.ts

export const formatCurrency = (value: number): string => {
  if (typeof window === 'undefined') return 'R$ ...'
  
  try {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value)
  } catch {
    return `R$ ${value.toFixed(2)}`
  }
}

export const formatNumber = (value: number): string => {
  if (typeof window === 'undefined') return value.toString()
  
  try {
    return new Intl.NumberFormat('pt-BR').format(value)
  } catch {
    return value.toString()
  }
}