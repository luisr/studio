// src/lib/validation.ts
import { z } from 'zod'
import { VALIDATION } from './constants'

// User validation schemas
export const userSchema = z.object({
  name: z.string().min(VALIDATION.minNameLength, `O nome deve ter pelo menos ${VALIDATION.minNameLength} caracteres.`),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  avatar: z.string().url('URL do avatar inválida.').optional(),
  role: z.enum(['Admin', 'Editor', 'Viewer']),
})

export const profileSchema = z.object({
  name: z.string().min(VALIDATION.minNameLength, `O nome deve ter pelo menos ${VALIDATION.minNameLength} caracteres.`),
  avatar: z.string().url('URL do avatar inválida.').optional(),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  phone: z.string().optional(),
})

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'A senha atual é obrigatória.'),
  newPassword: z.string().min(VALIDATION.minPasswordLength, `A nova senha deve ter pelo menos ${VALIDATION.minPasswordLength} caracteres.`),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
})

// Project validation schemas
export const projectSchema = z.object({
  name: z.string().min(1, 'O nome do projeto é obrigatório.'),
  description: z.string().optional(),
  managerId: z.string().min(1, 'É necessário selecionar um gerente.'),
  plannedStartDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  plannedEndDate: z.date({ required_error: 'A data de fim é obrigatória.' }),
  plannedBudget: z.coerce.number().min(0, 'O orçamento deve ser um valor positivo.'),
}).refine(data => data.plannedEndDate >= data.plannedStartDate, {
  message: 'A data de fim não pode ser anterior à data de início.',
  path: ['plannedEndDate'],
})

// Task validation schemas
export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  taskId: z.string(),
  taskName: z.string(),
  timestamp: z.string(),
})

export const taskSchema = z.object({
  name: z.string().min(1, { message: 'O nome da tarefa é obrigatório.' }),
  assignee: z.string().min(1, { message: 'Selecione um responsável.' }),
  status: z.string().min(1, { message: 'Selecione um status.' }),
  priority: z.enum(['Baixa', 'Média', 'Alta']),
  progress: z.number().min(0).max(100),
  plannedStartDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  plannedEndDate: z.date({ required_error: 'A data de fim é obrigatória.' }),
  
  // Form UI fields
  plannedEffort: z.coerce.number().min(0),
  plannedEffortUnit: z.enum(['hours', 'days', 'weeks', 'months']),
  actualEffort: z.coerce.number().min(0),
  actualEffortUnit: z.enum(['hours', 'days', 'weeks', 'months']),
  
  // Calculated fields
  plannedHours: z.coerce.number().min(0, { message: 'As horas planejadas devem ser positivas.' }),
  actualHours: z.coerce.number().min(0, { message: 'As horas reais devem ser positivas.' }),

  parentId: z.string().nullable().optional(),
  isMilestone: z.boolean().optional(),
  dependencies: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  attachments: z.array(attachmentSchema).optional(),
}).refine(data => data.plannedEndDate >= data.plannedStartDate, {
  message: 'A data de fim não pode ser anterior à data de início.',
  path: ['plannedEndDate'],
})