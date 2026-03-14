import { buildTicket, validateCreateTicketInput } from '@app/models/ticket'
import { CreateTicketInput } from '@app/types/CreateTicketInput'
import { Ticket } from '@app/types/Ticket'
import { TicketListFilters } from '@app/types/TicketListFilters'
import { ValidationError } from '@app/lib/errors'
import {
  fetchAllTickets,
  fetchTicket,
  storeTicket,
} from '@app/repositories/tickets-repository'

export const getAllTickets = async (
  filters: TicketListFilters = {},
): Promise<Ticket[]> => {
  return fetchAllTickets(filters)
}

export const getTicketById = async (id: string): Promise<Ticket | null> => {
  return fetchTicket(id)
}

export const createTicket = async (
  input: CreateTicketInput,
): Promise<Ticket> => {
  const validationErrorMessage = validateCreateTicketInput(input)

  if (validationErrorMessage) {
    throw new ValidationError(validationErrorMessage)
  }

  const ticket = buildTicket(input, crypto.randomUUID())
  await storeTicket(ticket)

  return ticket
}
