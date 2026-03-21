import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb'

import {
  getDynamoDBDocumentClient,
  getTicketsTableName,
} from '@app/lib/dynamodb'
import { ValidationError } from '@app/lib/errors'
import { logInfo, RequestContextLog } from '@app/lib/logger'
import { Ticket } from '@app/types/Ticket'
import { TicketListFilters } from '@app/types/TicketListFilters'
import { TicketListResult } from '@app/types/TicketListResult'

const CREATED_BY_CREATED_AT_INDEX_NAME = 'createdBy-createdAt-index'
const STATUS_CREATED_AT_INDEX_NAME = 'status-createdAt-index'

const encodeNextToken = (lastEvaluatedKey?: Record<string, unknown>) => {
  if (!lastEvaluatedKey) {
    return undefined
  }

  return Buffer.from(JSON.stringify(lastEvaluatedKey), 'utf8').toString(
    'base64url',
  )
}

const decodeNextToken = (nextToken?: string) => {
  if (!nextToken) {
    return undefined
  }

  try {
    const decodedValue = Buffer.from(nextToken, 'base64url').toString('utf8')
    const parsedToken = JSON.parse(decodedValue)

    if (!parsedToken || typeof parsedToken !== 'object') {
      throw new ValidationError('nextToken filter is invalid')
    }

    return parsedToken as Record<string, unknown>
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }

    throw new ValidationError('nextToken filter is invalid')
  }
}

export const fetchAllTickets = async (
  filters: TicketListFilters,
  requestContext: RequestContextLog = {},
): Promise<TicketListResult> => {
  const dynamoDBDocumentClient = getDynamoDBDocumentClient()
  const tableName = getTicketsTableName()
  const exclusiveStartKey = decodeNextToken(filters.nextToken)
  const expressionAttributeNames: Record<string, string> = {}
  const expressionAttributeValues: Record<string, string> = {}

  let items: Ticket[] = []
  let nextToken: string | undefined
  let accessPattern = 'scan'

  if (filters.createdBy) {
    expressionAttributeNames['#createdBy'] = 'createdBy'
    expressionAttributeValues[':createdBy'] = filters.createdBy

    if (filters.status) {
      expressionAttributeNames['#status'] = 'status'
      expressionAttributeValues[':status'] = filters.status
    }

    const result = await dynamoDBDocumentClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: CREATED_BY_CREATED_AT_INDEX_NAME,
        KeyConditionExpression: '#createdBy = :createdBy',
        ...(filters.status
          ? {
              FilterExpression: '#status = :status',
            }
          : {}),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: filters.limit,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: false,
      }),
    )

    items = (result.Items as Ticket[] | undefined) ?? []

    nextToken = encodeNextToken(result.LastEvaluatedKey)
    accessPattern = 'query-createdBy'
  } else if (filters.status) {
    expressionAttributeNames['#status'] = 'status'
    expressionAttributeValues[':status'] = filters.status

    const result = await dynamoDBDocumentClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: STATUS_CREATED_AT_INDEX_NAME,
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: filters.limit,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: false,
      }),
    )

    items = (result.Items as Ticket[] | undefined) ?? []
    nextToken = encodeNextToken(result.LastEvaluatedKey)
    accessPattern = 'query-status'
  } else {
    const result = await dynamoDBDocumentClient.send(
      new ScanCommand({
        TableName: tableName,
        Limit: filters.limit,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    )

    items = (result.Items as Ticket[] | undefined) ?? []
    nextToken = encodeNextToken(result.LastEvaluatedKey)
  }

  logInfo('REPOSITORY - DynamoDB scan finished', {
    ...requestContext,
    operation: 'tickets.list',
    accessPattern,
    limit: filters.limit,
    hasNextToken: Boolean(filters.nextToken),
    createdBy: filters.createdBy,
    status: filters.status,
    resultCount: items.length,
    hasMore: Boolean(nextToken),
  })

  return {
    items,
    limit: filters.limit,
    ...(nextToken ? { nextToken } : {}),
  }
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
