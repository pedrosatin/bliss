import { TicketPriority } from './TicketPriority'
import { TicketStatus } from './TicketStatus'

export interface Ticket {
  id: string
  title: string
  description?: string
  priority: TicketPriority
  createdBy: string
  status: TicketStatus
  createdAt: string
  updatedAt: string
}
