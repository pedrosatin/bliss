import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from 'aws-cdk-lib/aws-logs'
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apiGateway from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as path from 'path'

interface Options extends cdk.StackProps {
  stage: string
}

export const createBackofficeStack = (
  app: cdk.App,
  options: Options,
): cdk.Stack => {
  const { stage, ...stackProps } = options
  const stack = new cdk.Stack(app, `BackofficeStack-${stage}`, stackProps)

  // DynamoDB table
  const tableName = `backoffice-api-${stage}-tickets`

  const ticketsTable = new dynamodb.Table(stack, 'TicketsTable', {
    tableName,
    partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    removalPolicy:
      stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
  })

  // Shared Lambda config
  const handlerPath = path.join(
    __dirname,
    '../../src/handlers/tickets-handler.ts',
  )

  const commonFunctionProps: Omit<NodejsFunctionProps, 'handler'> = {
    runtime: lambda.Runtime.NODEJS_24_X,
    timeout: cdk.Duration.seconds(6),
    memorySize: 128,
    entry: handlerPath,
    bundling: {
      minify: true,
      sourceMap: false,
      target: 'node24',
    },
    environment: {
      TABLE_NAME: tableName,
    },
    logGroup: new logs.LogGroup(stack, 'TicketsLogGroup', {
      retention: logs.RetentionDays.FIVE_DAYS,
    }),
  }

  // Lambda functions
  const getAllTicketsFn = new NodejsFunction(stack, 'GetAllTicketsFunction', {
    ...commonFunctionProps,
    handler: 'handleGetAllTickets',
  })

  const getTicketFn = new NodejsFunction(stack, 'GetTicketFunction', {
    ...commonFunctionProps,
    handler: 'handleGetTicket',
  })

  const createTicketFn = new NodejsFunction(stack, 'CreateTicketFunction', {
    ...commonFunctionProps,
    handler: 'handleCreateTicket',
  })

  // DynamoDB permissions
  // Define specific permissions for each function to follow the principle of least privilege.
  // This is also why we have separate Lambda functions instead of a single one with a switch case on the handler.
  ticketsTable.grant(getAllTicketsFn, 'dynamodb:Scan')
  ticketsTable.grant(getTicketFn, 'dynamodb:GetItem')
  ticketsTable.grant(createTicketFn, 'dynamodb:PutItem')

  // HTTP API Gateway v2
  const httpApi = new apiGateway.HttpApi(stack, 'HttpApi', {
    apiName: `backoffice-api-${stage}`,
    corsPreflight: {
      allowMethods: [
        apiGateway.CorsHttpMethod.GET,
        apiGateway.CorsHttpMethod.POST,
        apiGateway.CorsHttpMethod.OPTIONS,
      ],
      allowOrigins: ['*'], // TODO: Create a web page and restrict this for production
      allowHeaders: ['Content-Type', 'x-request-id'],
    },
  })

  httpApi.addRoutes({
    path: '/requests',
    methods: [apiGateway.HttpMethod.GET],
    integration: new HttpLambdaIntegration(
      'GetAllTicketsIntegration',
      getAllTicketsFn,
    ),
  })

  httpApi.addRoutes({
    path: '/requests/{id}',
    methods: [apiGateway.HttpMethod.GET],
    integration: new HttpLambdaIntegration('GetTicketIntegration', getTicketFn),
  })

  httpApi.addRoutes({
    path: '/requests',
    methods: [apiGateway.HttpMethod.POST],
    integration: new HttpLambdaIntegration(
      'CreateTicketIntegration',
      createTicketFn,
    ),
  })

  // Outputs
  new cdk.CfnOutput(stack, 'ApiUrl', {
    value: httpApi.apiEndpoint,
    description: 'HTTP API endpoint URL',
    exportName: `backoffice-api-${stage}-url`,
  })

  new cdk.CfnOutput(stack, 'TableName', {
    value: ticketsTable.tableName,
    description: 'DynamoDB tickets table name',
  })

  return stack
}
