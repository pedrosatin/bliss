import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../src/lib/errors'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from '../src/models/ticket'

vi.mock('../src/repositories/tickets-repository', () => ({
  fetchAllTickets: vi.fn(),
  fetchTicket: vi.fn(),
  storeTicket: vi.fn(),
}))

import {
  createTicket,
  getAllTickets,
  getTicketById,
} from '../src/services/tickets-service'
import * as repo from '../src/repositories/tickets-repository'

const mockedFetchAll = vi.mocked(repo.fetchAllTickets)
const mockedFetch = vi.mocked(repo.fetchTicket)
const mockedStore = vi.mocked(repo.storeTicket)

const validInput = {
  title: 'Printer broken',
  priority: 'HIGH' as const,
  createdBy: 'ops@bliss.com',
}

describe('createTicket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws ValidationError when title is empty', async () => {
    await expect(
      createTicket({ ...validInput, title: '   ' }),
    ).rejects.toThrow(ValidationError)
  })

  it(`throws ValidationError when title exceeds ${TITLE_MAX_LENGTH} chars`, async () => {
    await expect(
      createTicket({ ...validInput, title: 'a'.repeat(TITLE_MAX_LENGTH + 1) }),
    ).rejects.toThrow(ValidationError)
  })

  it(`throws ValidationError when description exceeds ${DESCRIPTION_MAX_LENGTH} chars`, async () => {
    await expect(
      createTicket({
        ...validInput,
        description: 'x'.repeat(DESCRIPTION_MAX_LENGTH + 1),
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError when priority is invalid', async () => {
    await expect(
      createTicket({ ...validInput, priority: 'URGENT' as never }),
    ).rejects.toThrow(ValidationError)
  })

  it('throws ValidationError when createdBy is not an email', async () => {
    await expect(
      createTicket({ ...validInput, createdBy: 'not-an-email' }),
    ).rejects.toThrow(ValidationError)
  })

  it('creates ticket with status OPEN when not provided', async () => {
    mockedStore.mockResolvedValueOnce(undefined)

    const ticket = await createTicket(validInput)

    expect(ticket.status).toBe('OPEN')
    expect(mockedStore).toHaveBeenCalledOnce()
  })

  it('normalizes createdBy to lowercase', async () => {
    mockedStore.mockResolvedValueOnce(undefined)

    const ticket = await createTicket({ ...validInput, createdBy: 'OPS@Bliss.COM' })

    expect(ticket.createdBy).toBe('ops@bliss.com')
  })

  it('returns the created ticket', async () => {
    mockedStore.mockResolvedValueOnce(undefined)

    const ticket = await createTicket(validInput)

    expect(ticket).toMatchObject({
      title: 'Printer broken',
      priority: 'HIGH',
      createdBy: 'ops@bliss.com',
      status: 'OPEN',
    })
    expect(ticket.id).toBeDefined()
    expect(ticket.createdAt).toBeDefined()
  })
})

describe('getTicketById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when ticket does not exist', async () => {
    mockedFetch.mockResolvedValueOnce(null)

    const result = await getTicketById('nonexistent-id')

    expect(result).toBeNull()
    expect(mockedFetch).toHaveBeenCalledWith('nonexistent-id', {})
  })

  it('returns the ticket when found', async () => {
    const ticket = {
      id: 'ticket-1',
      title: 'Printer broken',
      priority: 'HIGH' as const,
      createdBy: 'ops@bliss.com',
      status: 'OPEN' as const,
      createdAt: '2026-03-21T00:00:00.000Z',
      updatedAt: '2026-03-21T00:00:00.000Z',
    }
    mockedFetch.mockResolvedValueOnce(ticket)

    const result = await getTicketById('ticket-1')

    expect(result).toEqual(ticket)
  })
})

describe('getAllTickets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes filters to the repository', async () => {
    const filters = { limit: 5, createdBy: 'ops@bliss.com', status: 'OPEN' as const }
    mockedFetchAll.mockResolvedValueOnce({ items: [], limit: 5 })

    await getAllTickets(filters)

    expect(mockedFetchAll).toHaveBeenCalledWith(filters, {})
  })

  it('returns paginated result from repository', async () => {
    const expected = {
      items: [
        {
          id: 'ticket-1',
          title: 'Printer broken',
          priority: 'HIGH' as const,
          createdBy: 'ops@bliss.com',
          status: 'OPEN' as const,
          createdAt: '2026-03-21T00:00:00.000Z',
          updatedAt: '2026-03-21T00:00:00.000Z',
        },
      ],
      limit: 10,
      nextToken: 'abc123',
    }
    mockedFetchAll.mockResolvedValueOnce(expected)

    const result = await getAllTickets({ limit: 10 })

    expect(result).toEqual(expected)
  })
})
