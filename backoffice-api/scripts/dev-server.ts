import { Hono, Context } from 'hono'
import { StatusCode } from 'hono/utils/http-status'
import { serve } from '@hono/node-server'
import { APIGatewayEvent, Context as LambdaContext } from 'aws-lambda'
import {
  handleGetAllTickets,
  handleGetTicket,
  handleCreateTicket,
} from '../src/handlers/tickets-handler'

const PORT = Number(process.env.PORT ?? 3000)

// Fake Lambda context
const makeLambdaContext = (): LambdaContext => ({
  awsRequestId: crypto.randomUUID(),
  functionName: 'dev-local',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'local',
  memoryLimitInMB: '128',
  logGroupName: '/local/dev',
  logStreamName: 'local',
  getRemainingTimeInMillis: () => 6000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
  callbackWaitsForEmptyEventLoop: false,
})

// Adapter: APIGatewayEvent
const toAPIGatewayEvent = (
  c: Context,
  pathParams: Record<string, string>,
  body: string,
): APIGatewayEvent => {
  const url = new URL(c.req.url)
  const qs = Object.fromEntries(url.searchParams)

  return {
    httpMethod: c.req.method,
    path: url.pathname,
    pathParameters: Object.keys(pathParams).length ? pathParams : null,
    queryStringParameters: Object.keys(qs).length ? qs : null,
    headers: Object.fromEntries(c.req.raw.headers),
    body: body || null,
    isBase64Encoded: false,
    requestContext: {
      requestId: crypto.randomUUID(),
    } as APIGatewayEvent['requestContext'],
    multiValueHeaders: {} as APIGatewayEvent['multiValueHeaders'],
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '',
  }
}

// App Server
const app = new Hono()

app.options('*', (c) => {
  return c.newResponse(null, 204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-request-id',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
})

app.get('/requests', async (c) => {
  const result = await handleGetAllTickets(
    toAPIGatewayEvent(c, {}, ''),
    makeLambdaContext(),
  )
  return c.newResponse(
    result.body,
    result.statusCode as StatusCode,
    result.headers as Record<string, string>,
  )
})

app.get('/requests/:id', async (c) => {
  const result = await handleGetTicket(
    toAPIGatewayEvent(c, { id: c.req.param('id') }, ''),
    makeLambdaContext(),
  )
  return c.newResponse(
    result.body,
    result.statusCode as StatusCode,
    result.headers as Record<string, string>,
  )
})

app.post('/requests', async (c) => {
  const body = await c.req.text()
  const result = await handleCreateTicket(
    toAPIGatewayEvent(c, {}, body),
    makeLambdaContext(),
  )
  return c.newResponse(
    result.body,
    result.statusCode as StatusCode,
    result.headers as Record<string, string>,
  )
})

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`\n🚀  Dev server running at http://localhost:${PORT}\n`)
  console.log('  GET    /requests')
  console.log('  GET    /requests/:id')
  console.log('  POST   /requests\n')
})
