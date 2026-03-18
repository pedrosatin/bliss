// Similar to https://github.com/baselime/lambda-logger/blob/main/index.js

import { HttpStatusCode } from '@app/types/HttpStatusCode'

type LogLevel = 'INFO' | 'WARN' | 'ERROR'
type Operations = 'tickets.list' | 'tickets.get' | 'tickets.create'

export interface RequestContextLog {
  requestId?: string
  awsRequestId?: string
  route?: string
  method?: string
}

export interface LogDetails extends RequestContextLog {
  operation: Operations
  statusCode?: HttpStatusCode
  ticketId?: string
  createdBy?: string
  priority?: string
  status?: string
  limit?: number
  hasNextToken?: boolean
  hasMore?: boolean
  accessPattern?: string
  resultCount?: number
  errorMessage?: string
  errorName?: string
  errorStack?: string
}

const serializeError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return {
      errorMessage: typeof error === 'string' ? error : 'Unknown error',
    }
  }

  return {
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack,
  }
}

const writeLog = (
  level: LogLevel,
  message: string,
  details: LogDetails,
): void => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...details,
  }

  const payloadStringified = JSON.stringify(payload)

  if (level === 'ERROR') {
    console.error(payloadStringified)
    return
  }

  if (level === 'WARN') {
    console.warn(payloadStringified)
    return
  }

  console.info(payloadStringified)
}

export const logInfo = (message: string, details: LogDetails): void => {
  writeLog('INFO', message, details)
}

export const logWarn = (message: string, details: LogDetails): void => {
  writeLog('WARN', message, details)
}

interface DetailsOptions extends Omit<
  LogDetails,
  'errorMessage' | 'errorName' | 'errorStack'
> {
  error: unknown
}

export const logError = (message: string, details: DetailsOptions): void => {
  const { error, ...restOfDetails } = details

  writeLog('ERROR', message, {
    ...restOfDetails,
    ...serializeError(error),
  })
}
