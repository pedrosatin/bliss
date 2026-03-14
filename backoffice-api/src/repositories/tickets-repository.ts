import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'

import {
  getDynamoDBDocumentClient,
  getTicketsTableName,
} from '@app/lib/dynamodb'
import { logInfo, RequestContextLog } from '@app/lib/logger'
import { Ticket } from '@app/types/Ticket'
import { TicketListFilters } from '@app/types/TicketListFilters'

export const fetchAllTickets = async (
  filters: TicketListFilters = {},
  requestContext: RequestContextLog = {},
): Promise<Ticket[]> => {
  // This uses a DynamoDB Scan, which reads the entire table on every call.
  // This is acceptable for this project, not for large scale cause it cost as the table grows.
  const dynamoDBDocumentClient = getDynamoDBDocumentClient()
  const filterExpressions: string[] = []
  const expressionAttributeNames: Record<string, string> = {}
  const expressionAttributeValues: Record<string, string> = {}

  if (filters.createdBy) {
    filterExpressions.push('#createdBy = :createdBy')
    expressionAttributeNames['#createdBy'] = 'createdBy'
    expressionAttributeValues[':createdBy'] = filters.createdBy
  }

  if (filters.status) {
    filterExpressions.push('#status = :status')
    expressionAttributeNames['#status'] = 'status'
    expressionAttributeValues[':status'] = filters.status
  }

  const result = await dynamoDBDocumentClient.send(
    new ScanCommand({
      TableName: getTicketsTableName(),
      ...(filterExpressions.length > 0
        ? {
            FilterExpression: filterExpressions.join(' AND '),
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
          }
        : {}),
    }),
  )

  const items = (result.Items as Ticket[] | undefined) ?? []

  logInfo('REPOSITORY - DynamoDB scan finished', {
    ...requestContext,
    operation: 'tickets.list',
    createdBy: filters.createdBy,
    status: filters.status,
    resultCount: items.length,
  })

  return items
}

export const fetchTicket = async (
  id: string,
  requestContext: RequestContextLog = {},
): Promise<Ticket | null> => {
  const dynamoDBDocumentClient = getDynamoDBDocumentClient()
  const result = await dynamoDBDocumentClient.send(
    new GetCommand({
      TableName: getTicketsTableName(),
      Key: { id },
      ConsistentRead: true,
    }),
  )

  const item = (result.Item as Ticket | undefined) ?? null

  logInfo('REPOSITORY - DynamoDB get finished', {
    ...requestContext,
    operation: 'tickets.get',
    ticketId: id,
    resultCount: item ? 1 : 0,
  })

  return item
}

export const storeTicket = async (
  ticket: Ticket,
  requestContext: RequestContextLog = {},
): Promise<void> => {
  const dynamoDBDocumentClient = getDynamoDBDocumentClient()

  await dynamoDBDocumentClient.send(
    new PutCommand({
      TableName: getTicketsTableName(),
      Item: ticket,
    }),
  )

  logInfo('REPOSITORY - DynamoDB put finished', {
    ...requestContext,
    operation: 'tickets.create',
    ticketId: ticket.id,
    createdBy: ticket.createdBy,
    priority: ticket.priority,
    status: ticket.status,
  })
}
