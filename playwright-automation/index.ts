import path from 'node:path'

import { createRequest } from './src/flows/create-request'
import { createRunArtifactsDir, writeRunOutput } from './src/utils/artifacts'
import { logger } from './src/utils/logger'
import { FlowResult } from './src/types/FlowResult'
import {
  CreateRequestAttemptResult,
  RequestCsvItem,
} from './src/types/FlowRequest'
import { readRequestsFromCsv } from './src/utils/csv'
import { BrowserContext, chromium } from 'playwright'

const taskName = process.env.RPA_TASK_NAME ?? 'create-proposal'
const flowName = 'create-bliss-request'
const csvPath =
  process.env.RPA_INPUT_CSV_PATH ??
  path.resolve(process.cwd(), 'src/examples/form-data.csv')
const maxRetryCount = 1

async function runRequestWithRetry(
  context: BrowserContext,
  csvItem: RequestCsvItem,
  artifactsDir: string,
): Promise<{
  finalResult: CreateRequestAttemptResult
  attempts: CreateRequestAttemptResult[]
}> {
  let lastResult: CreateRequestAttemptResult | undefined
  const attempts: CreateRequestAttemptResult[] = []

  for (let attempt = 1; attempt <= maxRetryCount + 1; attempt += 1) {
    const result = await createRequest(
      context,
      { csvItem, attempt },
      artifactsDir,
    )
    lastResult = result
    attempts.push(result)

    if (result.success) {
      return {
        finalResult: result,
        attempts,
      }
    }

    if (attempt <= maxRetryCount) {
      logger.info('Retry do item após falha', {
        rowNumber: csvItem.rowNumber,
        attempt,
      })
    }
  }

  return {
    finalResult: lastResult as CreateRequestAttemptResult,
    attempts,
  }
}

function buildSummary(
  items: CreateRequestAttemptResult[],
): FlowResult['summary'] {
  const successCount = items.filter((item) => item.success).length

  return {
    total: items.length,
    successCount,
    failureCount: items.length - successCount,
  }
}

async function runBatch(
  context: Parameters<typeof createRequest>[0],
): Promise<FlowResult> {
  const artifactsDir = await createRunArtifactsDir(flowName)
  logger.info('Lendo CSV de entrada', { csvPath })

  const requests = await readRequestsFromCsv(csvPath)
  const itemResults: CreateRequestAttemptResult[] = []
  const attemptResults: CreateRequestAttemptResult[] = []

  for (const item of requests) {
    const { finalResult, attempts } = await runRequestWithRetry(
      context,
      item,
      artifactsDir,
    )
    itemResults.push(finalResult)
    attemptResults.push(...attempts)
  }

  const summary = buildSummary(itemResults)
  const outputPath = await writeRunOutput(flowName, {
    flow: flowName,
    taskName,
    sourceCsvPath: csvPath,
    retryPolicy: {
      maxRetryCount,
    },
    summary,
    items: itemResults,
    attempts: attemptResults,
    finishedAt: new Date().toISOString(),
  })

  return {
    success: summary.failureCount === 0,
    artifactsDir,
    outputPath,
    summary,
    items: itemResults,
    attempts: attemptResults,
  }
}

async function main(): Promise<void> {
  logger.info('Iniciando task RPA', { taskName })

  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
  })

  const context = await browser.newContext()

  try {
    const result = await runBatch(context)

    logger.info('Task finalizada com sucesso', {
      taskName,
      artifactsDir: result.artifactsDir,
      outputPath: result.outputPath,
      summary: result.summary,
    })

    if (!result.success) {
      process.exitCode = 1
    }
  } catch (error) {
    logger.error('Falha na execução', {
      taskName,
      error: error instanceof Error ? error.message : String(error),
    })

    process.exitCode = 1
  } finally {
    await context.close()
    await browser.close()
  }
}

main()
