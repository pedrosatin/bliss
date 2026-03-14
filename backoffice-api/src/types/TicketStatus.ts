export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED']

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED'

export const isTicketStatus = (status?: string) =>
  status && TICKET_STATUSES.includes(status)
