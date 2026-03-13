export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export const isTicketPriority = (priority?: string) =>
  priority && TICKET_PRIORITIES.includes(priority)
