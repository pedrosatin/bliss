import { APIGatewayEvent, Context, APIGatewayProxyResult } from 'aws-lambda'
import { successResponse } from '../lib/response'

export const handleGetAll = async (
  _event: APIGatewayEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  return successResponse(200, 'Hello World')
}
