import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const DEFAULT_REGION = 'sa-east-1'

const createDynamoDBClient = (): DynamoDBClient => {
  const endpoint = process.env['DYNAMODB_ENDPOINT']

  return new DynamoDBClient({
    region: process.env['AWS_REGION'] ?? DEFAULT_REGION,
    endpoint: endpoint || undefined,
    // Fake credentials are only used when DYNAMODB_ENDPOINT is set (local development).
    // In Lambda, the SDK picks up the IAM role credentials automatically.
    credentials: endpoint
      ? {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        }
      : undefined,
  })
}

let dynamoDBDocumentClient: DynamoDBDocumentClient | undefined

export const getDynamoDBDocumentClient = (): DynamoDBDocumentClient => {
  if (!dynamoDBDocumentClient) {
    dynamoDBDocumentClient = DynamoDBDocumentClient.from(
      createDynamoDBClient(),
      {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      },
    )
  }

  return dynamoDBDocumentClient
}

export const getTicketsTableName = (): string => {
  const tableName = process.env['TABLE_NAME']

  if (!tableName) {
    throw new Error('Missing required environment variable: TABLE_NAME')
  }

  return tableName
}
