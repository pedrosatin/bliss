import { TicketPriority } from './TicketPriority'
import { TicketStatus } from './TicketStatus'

export interface CreateTicketInput {
  title: string
  description?: string
  priority: TicketPriority
  createdBy: string
  status?: TicketStatus
}
