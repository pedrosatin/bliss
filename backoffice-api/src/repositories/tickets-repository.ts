import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'

import {
  getDynamoDBDocumentClient,
  getTicketsTableName,
} from '@app/lib/dynamodb'
import { Ticket } from '@app/types/Ticket'
import { TicketListFilters } from '@app/types/TicketListFilters'

export const fetchAllTickets = async (
  filters: TicketListFilters = {},
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

  return (result.Items as Ticket[] | undefined) ?? []
}

export const fetchTicket = async (id: string): Promise<Ticket | null> => {
  const dynamoDBDocumentClient = getDynamoDBDocumentClient()
  const result = await dynamoDBDocumentClient.send(
    new GetCommand({
      TableName: getTicketsTableName(),
      Key: { id },
      ConsistentRead: true,
    }),
  )

  return (result.Item as Ticket | undefined) ?? null
}

export const storeTicket = async (ticket: Ticket): Promise<void> => {
  const dynamoDBDocumentClient = getDynamoDBDocumentClient()

  await dynamoDBDocumentClient.send(
    new PutCommand({
      TableName: getTicketsTableName(),
      Item: ticket,
    }),
  )
}
