import { APIGatewayEvent, Context } from 'aws-lambda'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../src/lib/errors'
import { Ticket } from '../src/types/Ticket'

vi.mock('../src/services/tickets-service', () => ({
  createTicket: vi.fn(),
  getTicketById: vi.fn(),
  getAllTickets: vi.fn(),
}))

import {
  handleCreateTicket,
  handleGetTicket,
  handleGetAllTickets,
} from '../src/handlers/tickets-handler'
import * as service from '../src/services/tickets-service'

const mockedCreate = vi.mocked(service.createTicket)
const mockedGet = vi.mocked(service.getTicketById)
const mockedGetAll = vi.mocked(service.getAllTickets)

const defaultEvent = {
  httpMethod: 'GET',
  path: '/requests',
  pathParameters: null,
  queryStringParameters: null,
  body: null,
  requestContext: { requestId: 'test-request-id' },
} as APIGatewayEvent

const fakeContext = { awsRequestId: 'ctx-id' } as Context

const stubTicket: Ticket = {
  id: 'ticket-1',
  title: 'Printer broken',
  priority: 'HIGH',
  createdBy: 'ops@bliss.com',
  status: 'OPEN',
  createdAt: '2026-03-21T00:00:00.000Z',
  updatedAt: '2026-03-21T00:00:00.000Z',
}

describe('handleGetTicket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when ticket does not exist', async () => {
    mockedGet.mockResolvedValueOnce(null)

    const result = await handleGetTicket(
      { ...defaultEvent, pathParameters: { id: 'missing' } },
      fakeContext,
    )

    expect(result.statusCode).toBe(404)
  })

  it('returns 200 with ticket when found', async () => {
    mockedGet.mockResolvedValueOnce(stubTicket)

    const result = await handleGetTicket(
      { ...defaultEvent, pathParameters: { id: 'ticket-1' } },
      fakeContext,
    )

    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body)).toMatchObject({ id: 'ticket-1' })
  })
})

describe('handleCreateTicket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for malformed JSON body', async () => {
    const result = await handleCreateTicket(
      { ...defaultEvent, httpMethod: 'POST', body: '{invalid}' },
      fakeContext,
    )

    expect(result.statusCode).toBe(400)
  })

  it('returns 400 when service throws ValidationError', async () => {
    mockedCreate.mockRejectedValueOnce(new ValidationError('title is required'))

    const result = await handleCreateTicket(
      {
        ...defaultEvent,
        httpMethod: 'POST',
        body: JSON.stringify({ title: '' }),
      },
      fakeContext,
    )

    expect(result.statusCode).toBe(400)
  })

  it('returns 201 with created ticket', async () => {
    mockedCreate.mockResolvedValueOnce(stubTicket)

    const result = await handleCreateTicket(
      {
        ...defaultEvent,
        httpMethod: 'POST',
        body: JSON.stringify({
          title: 'Printer broken',
          priority: 'HIGH',
          createdBy: 'ops@bliss.com',
        }),
      },
      fakeContext,
    )

    expect(result.statusCode).toBe(201)
    expect(JSON.parse(result.body)).toMatchObject({ id: 'ticket-1' })
  })
})

describe('handleGetAllTickets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for invalid status filter', async () => {
    const result = await handleGetAllTickets(
      { ...defaultEvent, queryStringParameters: { status: 'INVALID' } },
      fakeContext,
    )

    expect(result.statusCode).toBe(400)
  })

  it('returns 200 with paginated result', async () => {
    mockedGetAll.mockResolvedValueOnce({ items: [stubTicket], limit: 10 })

    const result = await handleGetAllTickets(
      { ...defaultEvent, queryStringParameters: { status: 'OPEN' } },
      fakeContext,
    )

    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body).items).toHaveLength(1)
  })
})
