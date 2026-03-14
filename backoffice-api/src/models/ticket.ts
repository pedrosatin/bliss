import { CreateTicketInput } from '@app/types/CreateTicketInput'
import { Ticket } from '@app/types/Ticket'
import { TicketListFilterInput } from '@app/types/TicketListFilterInput'
import { TicketListFilters } from '@app/types/TicketListFilters'
import { isTicketPriority } from '@app/types/TicketPriority'
import { isTicketStatus, TicketStatus } from '@app/types/TicketStatus'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeQueryValue = (value?: string | null): string | undefined => {
  const normalizedValue = value?.trim()
  return normalizedValue ? normalizedValue : undefined
}

export const validateCreateTicketInput = (
  input: Partial<CreateTicketInput>,
): string | null => {
  if (!input.title?.trim()) {
    return 'Please inform the title'
  }

  if (!isTicketPriority(input.priority)) {
    return 'Priority must be one of LOW, MEDIUM, HIGH'
  }

  if (!input.createdBy?.trim() || !EMAIL_REGEX.test(input.createdBy.trim())) {
    return 'createdBy must be a valid email'
  }

  if (input.status && !isTicketStatus(input.status)) {
    return 'Status must be one of OPEN, IN_PROGRESS, CLOSED'
  }

  return null
}

export const validateTicketListFilterInput = (
  input: TicketListFilterInput,
): string | null => {
  const normalizedCreatedBy = normalizeQueryValue(input.createdBy)
  const normalizedStatus = normalizeQueryValue(input.status)?.toUpperCase()

  if (
    input.createdBy !== undefined &&
    (!normalizedCreatedBy || !EMAIL_REGEX.test(normalizedCreatedBy))
  ) {
    return 'createdBy filter must be a valid email'
  }

  if (input.status !== undefined && !isTicketStatus(normalizedStatus)) {
    return 'status filter must be one of OPEN, IN_PROGRESS, CLOSED'
  }

  return null
}

export const buildTicketListFilters = (
  input: TicketListFilterInput,
): TicketListFilters => {
  const createdBy = input.createdBy?.trim()?.toLowerCase()
  const normalizedStatus = normalizeQueryValue(input.status)?.toUpperCase()

  let inputFilter: TicketListFilters = {}

  if (createdBy) {
    inputFilter = { ...inputFilter, createdBy }
  }

  if (normalizedStatus && isTicketStatus(normalizedStatus)) {
    inputFilter = { ...inputFilter, status: normalizedStatus as TicketStatus }
  }

  return inputFilter
}

export const buildTicket = (
  input: CreateTicketInput,
  id: string,
  now = new Date().toISOString(),
): Ticket => {
  return {
    id,
    title: input.title.trim(),
    description: input.description?.trim(),
    priority: input.priority,
    createdBy: input.createdBy.trim().toLowerCase(),
    status: input.status ?? 'OPEN',
    createdAt: now,
    updatedAt: now,
  }
}
