import { TicketStatus } from './TicketStatus'

export interface TicketListFilters {
  limit: number
  createdBy?: string
  status?: TicketStatus
  nextToken?: string
}
