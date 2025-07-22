// src/lib/utils/file.ts
import { VALIDATION } from '../constants'

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > VALIDATION.maxFileSize) {
      reject(new Error(`Arquivo muito grande. Tamanho máximo: ${VALIDATION.maxFileSize / (1024 * 1024)}MB`))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}