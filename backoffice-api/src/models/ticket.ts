import { CreateTicketInput } from '@app/types/CreateTicketInput'
import { Ticket } from '@app/types/Ticket'
import { TicketListFilterInput } from '@app/types/TicketListFilterInput'
import { TicketListFilters } from '@app/types/TicketListFilters'
import { isTicketPriority } from '@app/types/TicketPriority'
import { isTicketStatus, TicketStatus } from '@app/types/TicketStatus'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const DEFAULT_TICKET_LIST_LIMIT = 10
export const MAX_TICKET_LIST_LIMIT = 100
export const TITLE_MAX_LENGTH = 120
export const DESCRIPTION_MAX_LENGTH = 1000

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

  if (input.title.trim().length > TITLE_MAX_LENGTH) {
    return `Title must be at most ${TITLE_MAX_LENGTH} characters`
  }

  if (input.description && input.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    return `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`
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
  const normalizedLimit = normalizeQueryValue(input.limit)
  const normalizedNextToken = normalizeQueryValue(input.nextToken)

  if (
    input.createdBy !== undefined &&
    (!normalizedCreatedBy || !EMAIL_REGEX.test(normalizedCreatedBy))
  ) {
    return 'createdBy filter must be a valid email'
  }

  if (input.status !== undefined && !isTicketStatus(normalizedStatus)) {
    return 'status filter must be one of OPEN, IN_PROGRESS, CLOSED'
  }

  if (input.limit !== undefined) {
    if (!normalizedLimit) {
      return `limit filter must be an integer between 1 and ${MAX_TICKET_LIST_LIMIT}`
    }

    const parsedLimit = Number(normalizedLimit)

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > MAX_TICKET_LIST_LIMIT
    ) {
      return `limit filter must be an integer between 1 and ${MAX_TICKET_LIST_LIMIT}`
    }
  }

  if (input.nextToken !== undefined && !normalizedNextToken) {
    return 'nextToken filter must be a non-empty string'
  }

  return null
}

export const buildTicketListFilters = (
  input: TicketListFilterInput,
): TicketListFilters => {
  const createdBy = input.createdBy?.trim()?.toLowerCase()
  const normalizedStatus = normalizeQueryValue(input.status)?.toUpperCase()
  const normalizedLimit = normalizeQueryValue(input.limit)
  const nextToken = normalizeQueryValue(input.nextToken)
  const parsedLimit = normalizedLimit ? Number(normalizedLimit) : undefined

  const limit =
    parsedLimit !== undefined && Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), MAX_TICKET_LIST_LIMIT)
      : DEFAULT_TICKET_LIST_LIMIT

  let inputFilter: TicketListFilters = { limit }

  if (createdBy) {
    inputFilter = { ...inputFilter, createdBy }
  }

  if (normalizedStatus && isTicketStatus(normalizedStatus)) {
    inputFilter = { ...inputFilter, status: normalizedStatus as TicketStatus }
  }

  if (nextToken) {
    inputFilter = { ...inputFilter, nextToken }
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
