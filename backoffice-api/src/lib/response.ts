import type { APIGatewayProxyResult } from 'aws-lambda'

const defaultHeaders = {
  'Content-Type': 'application/json',
}

export const successResponse = (
  statusCode: number,
  data: unknown,
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(data),
  }
}

export const errorResponse = (
  statusCode: number,
  message: string,
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify({
      error: message,
    }),
  }
}
