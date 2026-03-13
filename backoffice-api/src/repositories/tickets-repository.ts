import { Ticket } from '../types/Ticket'
import { TicketListFilters } from '../types/TicketListFilters'

export const fetchAllTickets = async (
  filters: TicketListFilters = {},
): Promise<Ticket[]> => {
  return Promise.resolve([
    {
      id: '1',
      title: 'Example Ticket 1',
      description: 'This is an example ticket',
      priority: 'MEDIUM',
      createdBy: 'user1',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Example Ticket 2',
      description: 'This is another example ticket',
      priority: 'HIGH',
      createdBy: 'user2',
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ])
}

export const fetchTicket = async (id: string): Promise<Ticket | null> => {
  return Promise.resolve({
    id,
    title: 'Example Ticket',
    description: 'This is an example ticket',
    priority: 'MEDIUM',
    createdBy: 'user1',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export const storeTicket = async (ticket: Ticket): Promise<void> => {
  return Promise.resolve()
}
