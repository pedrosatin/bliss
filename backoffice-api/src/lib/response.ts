import { APIGatewayProxyResult } from 'aws-lambda'

import { HttpStatusCode } from '../types/HttpStatusCode'

const defaultHeaders = {
  'Content-Type': 'application/json',
}

interface ResponseHeaders {
  [key: string]: string
}

export const successResponse = (
  statusCode: HttpStatusCode,
  data: unknown,
  headers: ResponseHeaders = {},
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body: JSON.stringify(data),
  }
}

export const errorResponse = (
  statusCode: HttpStatusCode,
  message: string,
  headers: ResponseHeaders = {},
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body: JSON.stringify({
      error: message,
    }),
  }
}
