export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED']

export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const isTicketStatus = (status?: string) =>
  status && TICKET_STATUSES.includes(status)
