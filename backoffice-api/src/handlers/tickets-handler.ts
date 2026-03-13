import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'

import { ValidationError } from '../lib/errors'
import { HttpStatusCode } from '../types/HttpStatusCode'
import { errorResponse, successResponse } from '../lib/response'
import {
  buildTicketListFilters,
  validateTicketListFilterInput,
} from '../models/ticket'
import { CreateTicketInput } from '../types/CreateTicketInput'
import {
  createTicket,
  getAllTickets,
  getTicketById,
} from '../services/tickets-service'

const getRequestId = (event: APIGatewayEvent, context: Context): string => {
  return event.requestContext.requestId || context.awsRequestId || 'unknown'
}

const buildRequestHeaders = (requestId: string): Record<string, string> => {
  return {
    'x-request-id': requestId,
  }
}

export const handleGetAllTickets = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event, context)
  const listFiltersInput = {
    createdBy: event.queryStringParameters?.createdBy,
    status: event.queryStringParameters?.status,
  }
  const listFiltersError = validateTicketListFilterInput(listFiltersInput)

  if (listFiltersError) {
    return errorResponse(
      HttpStatusCode.BadRequest,
      listFiltersError,
      buildRequestHeaders(requestId),
    )
  }

  const listFilters = buildTicketListFilters(listFiltersInput)

  try {
    const tickets = await getAllTickets(listFilters)

    return successResponse(
      HttpStatusCode.Ok,
      tickets,
      buildRequestHeaders(requestId),
    )
  } catch {
    return errorResponse(
      HttpStatusCode.InternalServerError,
      'Error retrieving tickets',
      buildRequestHeaders(requestId),
    )
  }
}

export const handleGetTicket = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event, context)
  const ticketId = event.pathParameters?.id

  if (!ticketId) {
    return errorResponse(
      HttpStatusCode.BadRequest,
      'Ticket ID is required',
      buildRequestHeaders(requestId),
    )
  }

  try {
    const ticket = await getTicketById(ticketId)

    if (!ticket) {
      return errorResponse(
        HttpStatusCode.NotFound,
        'Ticket not found',
        buildRequestHeaders(requestId),
      )
    }

    return successResponse(
      HttpStatusCode.Ok,
      ticket,
      buildRequestHeaders(requestId),
    )
  } catch {
    return errorResponse(
      HttpStatusCode.InternalServerError,
      'Error retrieving ticket',
      buildRequestHeaders(requestId),
    )
  }
}

export const handleCreateTicket = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event, context)
  let ticketData: CreateTicketInput

  try {
    ticketData = JSON.parse(event.body || '{}')
  } catch {
    return errorResponse(
      HttpStatusCode.BadRequest,
      'Invalid JSON payload',
      buildRequestHeaders(requestId),
    )
  }

  try {
    const newTicket = await createTicket(ticketData)

    return successResponse(
      HttpStatusCode.Created,
      newTicket,
      buildRequestHeaders(requestId),
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(
        HttpStatusCode.BadRequest,
        error.message,
        buildRequestHeaders(requestId),
      )
    }

    return errorResponse(
      HttpStatusCode.InternalServerError,
      'Error creating ticket',
      buildRequestHeaders(requestId),
    )
  }
}
