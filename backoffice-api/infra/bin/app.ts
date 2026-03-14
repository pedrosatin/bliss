import * as cdk from 'aws-cdk-lib'
import { createBackofficeStack } from '../lib/backoffice-stack'

const app = new cdk.App()
const stage = app.node.tryGetContext('stage') ?? 'dev'

createBackofficeStack(app, {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'sa-east-1',
  },
  tags: {
    project: 'bliss',
    service: 'backoffice-api',
  },
})
