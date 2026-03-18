import { Ticket } from './Ticket'

export interface TicketListResult {
  items: Ticket[]
  limit: number
  nextToken?: string
}
