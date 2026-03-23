import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'

import { ValidationError } from '@app/lib/errors'
import { logError, logInfo, logWarn, RequestContextLog } from '@app/lib/logger'
import { HttpStatusCode } from '@app/types/HttpStatusCode'
import { errorResponse, successResponse } from '@app/lib/response'
import {
  buildTicketListFilters,
  validateTicketListFilterInput,
} from '@app/models/ticket'
import { CreateTicketInput } from '@app/types/CreateTicketInput'
import {
  createTicket,
  getAllTickets,
  getTicketById,
} from '@app/services/tickets-service'

const getRequestId = (event: APIGatewayEvent, context: Context): string => {
  return event.requestContext.requestId || context.awsRequestId || 'unknown'
}

const buildRequestContext = (
  event: APIGatewayEvent,
  context: Context,
  requestId: string,
): RequestContextLog => {
  return {
    requestId,
    awsRequestId: context.awsRequestId,
    route: event.path,
    method: event.httpMethod,
  }
}

const buildRequestIdHeader = (requestId: string): Record<string, string> => {
  return {
    'x-request-id': requestId,
  }
}

export const handleGetAllTickets = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event, context)
  const requestContext = buildRequestContext(event, context, requestId)
  const listFiltersInput = {
    createdBy: event.queryStringParameters?.createdBy,
    status: event.queryStringParameters?.status,
    limit: event.queryStringParameters?.limit,
    nextToken: event.queryStringParameters?.nextToken,
  }
  const listFiltersError = validateTicketListFilterInput(listFiltersInput)

  if (listFiltersError) {
    logWarn('HANDLER - Listing tickets rejected by validation', {
      ...requestContext,
      operation: 'tickets.list',
      createdBy: listFiltersInput.createdBy ?? undefined,
      status: listFiltersInput.status ?? undefined,
      hasNextToken: Boolean(listFiltersInput.nextToken),
      statusCode: HttpStatusCode.BadRequest,
    })

    return errorResponse(
      HttpStatusCode.BadRequest,
      listFiltersError,
      buildRequestIdHeader(requestId),
    )
  }

  const listFilters = buildTicketListFilters(listFiltersInput)

  try {
    logInfo('HANDLER - Listing tickets started', {
      ...requestContext,
      operation: 'tickets.list',
      limit: listFilters.limit,
      createdBy: listFilters.createdBy,
      status: listFilters.status,
      hasNextToken: Boolean(listFilters.nextToken),
    })

    const listResult = await getAllTickets(listFilters, requestContext)

    logInfo('HANDLER - Listing tickets finished', {
      ...requestContext,
      operation: 'tickets.list',
      limit: listFilters.limit,
      createdBy: listFilters.createdBy,
      status: listFilters.status,
      hasNextToken: Boolean(listFilters.nextToken),
      hasMore: Boolean(listResult.nextToken),
      statusCode: HttpStatusCode.Ok,
      resultCount: listResult.items.length,
    })

    return successResponse(
      HttpStatusCode.Ok,
      listResult,
      buildRequestIdHeader(requestId),
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      logWarn('HANDLER - Listing tickets rejected by validation', {
        ...requestContext,
        operation: 'tickets.list',
        limit: listFilters.limit,
        createdBy: listFilters.createdBy,
        status: listFilters.status,
        hasNextToken: Boolean(listFilters.nextToken),
        statusCode: HttpStatusCode.BadRequest,
      })

      return errorResponse(
        HttpStatusCode.BadRequest,
        error.message,
        buildRequestIdHeader(requestId),
      )
    }

    logError('HANDLER - Listing tickets failed', {
      ...requestContext,
      operation: 'tickets.list',
      limit: listFilters.limit,
      createdBy: listFilters.createdBy,
      status: listFilters.status,
      hasNextToken: Boolean(listFilters.nextToken),
      statusCode: HttpStatusCode.InternalServerError,
      error,
    })

    return errorResponse(
      HttpStatusCode.InternalServerError,
      'Error retrieving tickets',
      buildRequestIdHeader(requestId),
    )
  }
}

export const handleGetTicket = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event, context)
  const requestContext = buildRequestContext(event, context, requestId)
  const ticketId = event.pathParameters?.id

  if (!ticketId) {
    logWarn('HANDLER - Get ticket rejected because id is missing', {
      ...requestContext,
      operation: 'tickets.get',
      statusCode: HttpStatusCode.BadRequest,
    })

    return errorResponse(
      HttpStatusCode.BadRequest,
      'Ticket ID is required',
      buildRequestIdHeader(requestId),
    )
  }

  try {
    logInfo('HANDLER - Fetching ticket started', {
      ...requestContext,
      operation: 'tickets.get',
      ticketId,
    })

    const ticket = await getTicketById(ticketId, requestContext)

    if (!ticket) {
      logWarn('HANDLER - Ticket not found', {
        ...requestContext,
        operation: 'tickets.get',
        ticketId,
        statusCode: HttpStatusCode.NotFound,
      })

      return errorResponse(
        HttpStatusCode.NotFound,
        'Ticket not found',
        buildRequestIdHeader(requestId),
      )
    }

    logInfo('HANDLER - Fetching ticket finished', {
      ...requestContext,
      operation: 'tickets.get',
      ticketId,
      statusCode: HttpStatusCode.Ok,
    })

    return successResponse(
      HttpStatusCode.Ok,
      ticket,
      buildRequestIdHeader(requestId),
    )
  } catch (error) {
    logError('HANDLER - Fetching ticket failed', {
      ...requestContext,
      operation: 'tickets.get',
      ticketId,
      statusCode: HttpStatusCode.InternalServerError,
      error,
    })

    return errorResponse(
      HttpStatusCode.InternalServerError,
      'Error retrieving ticket',
      buildRequestIdHeader(requestId),
    )
  }
}

export const handleCreateTicket = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event, context)
  const requestContext = buildRequestContext(event, context, requestId)
  let ticketData: CreateTicketInput

  try {
    ticketData = JSON.parse(event.body || '{}')
  } catch {
    logWarn(
      'HANDLER - Create ticket rejected because payload is invalid JSON',
      {
        ...requestContext,
        operation: 'tickets.create',
        statusCode: HttpStatusCode.BadRequest,
      },
    )

    return errorResponse(
      HttpStatusCode.BadRequest,
      'Invalid JSON payload',
      buildRequestIdHeader(requestId),
    )
  }

  try {
    logInfo('HANDLER - Create ticket started', {
      ...requestContext,
      operation: 'tickets.create',
      createdBy: ticketData.createdBy,
      priority: ticketData.priority,
    })

    const newTicket = await createTicket(ticketData, requestContext)

    logInfo('HANDLER - Create ticket finished', {
      ...requestContext,
      operation: 'tickets.create',
      ticketId: newTicket.id,
      createdBy: newTicket.createdBy,
      priority: newTicket.priority,
      status: newTicket.status,
      statusCode: HttpStatusCode.Created,
    })

    return successResponse(
      HttpStatusCode.Created,
      { id: newTicket.id },
      buildRequestIdHeader(requestId),
    )
  } catch (error) {
    if (error instanceof ValidationError) {
      logWarn('HANDLER - Create ticket rejected by validation', {
        ...requestContext,
        operation: 'tickets.create',
        createdBy: ticketData.createdBy,
        priority: ticketData.priority,
        statusCode: HttpStatusCode.BadRequest,
      })

      return errorResponse(
        HttpStatusCode.BadRequest,
        error.message,
        buildRequestIdHeader(requestId),
      )
    }

    logError('HANDLER - Create ticket failed', {
      ...requestContext,
      operation: 'tickets.create',
      createdBy: ticketData.createdBy,
      priority: ticketData.priority,
      statusCode: HttpStatusCode.InternalServerError,
      error,
    })

    return errorResponse(
      HttpStatusCode.InternalServerError,
      'Error creating ticket',
      buildRequestIdHeader(requestId),
    )
  }
}
