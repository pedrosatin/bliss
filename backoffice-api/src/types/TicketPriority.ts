export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export const isTicketPriority = (priority?: string) =>
  priority && TICKET_PRIORITIES.includes(priority)
