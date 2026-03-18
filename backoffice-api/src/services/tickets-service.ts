import { buildTicket, validateCreateTicketInput } from '@app/models/ticket'
import { CreateTicketInput } from '@app/types/CreateTicketInput'
import { logError, logInfo, RequestContextLog } from '@app/lib/logger'
import { Ticket } from '@app/types/Ticket'
import { TicketListFilters } from '@app/types/TicketListFilters'
import { TicketListResult } from '@app/types/TicketListResult'
import { ValidationError } from '@app/lib/errors'
import {
  fetchAllTickets,
  fetchTicket,
  storeTicket,
} from '@app/repositories/tickets-repository'

export const getAllTickets = async (
  filters: TicketListFilters,
  requestContext: RequestContextLog = {},
): Promise<TicketListResult> => {
  logInfo('SERVICE - Fetching tickets from repository', {
    ...requestContext,
    operation: 'tickets.list',
    limit: filters.limit,
    createdBy: filters.createdBy,
    status: filters.status,
    hasNextToken: Boolean(filters.nextToken),
  })

  return fetchAllTickets(filters, requestContext)
}

export const getTicketById = async (
  id: string,
  requestContext: RequestContextLog = {},
): Promise<Ticket | null> => {
  logInfo('SERVICE - Fetching ticket from repository', {
    ...requestContext,
    operation: 'tickets.get',
    ticketId: id,
  })

  return fetchTicket(id, requestContext)
}

export const createTicket = async (
  input: CreateTicketInput,
  requestContext: RequestContextLog = {},
): Promise<Ticket> => {
  const validationErrorMessage = validateCreateTicketInput(input)

  if (validationErrorMessage) {
    logError('SERVICE - Create ticket input validation ', {
      ...requestContext,
      operation: 'tickets.create',
      error: validationErrorMessage,
    })
    throw new ValidationError(validationErrorMessage)
  }

  const ticket = buildTicket(input, crypto.randomUUID())

  logInfo('SERVICE - Storing new ticket in repository', {
    ...requestContext,
    operation: 'tickets.create',
    ticketId: ticket.id,
    createdBy: ticket.createdBy,
    priority: ticket.priority,
    status: ticket.status,
  })

  await storeTicket(ticket, requestContext)

  return ticket
}
