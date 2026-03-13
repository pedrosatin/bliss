import { TicketStatus } from './TicketStatus'

export interface TicketListFilters {
  createdBy?: string
  status?: TicketStatus
}
