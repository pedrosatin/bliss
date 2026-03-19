import 'dotenv/config'
import path from 'node:path'

import { createRequest } from './src/flows/create-request'
import { createRunArtifactsDir, writeRunOutput } from './src/utils/artifacts'
import { logger } from './src/utils/logger'
import { FlowResult } from './src/types/FlowResult'
import { CreateRequestResult } from './src/types/FlowRequest'
import { readRequestsFromCsv } from './src/utils/csv'
import { chromium, Browser } from 'playwright'

const taskName = process.env.RPA_TASK_NAME ?? 'create-proposal'
const flowName = 'create-bliss-request'
const csvPath =
  process.env.RPA_INPUT_CSV_PATH ??
  path.resolve(process.cwd(), 'src/examples/form-data.csv')

function buildSummary(items: CreateRequestResult[]): FlowResult['summary'] {
  const successCount = items.filter((item) => item.success).length

  return {
    total: items.length,
    successCount,
    failureCount: items.length - successCount,
  }
}

async function runBatch(browser: Browser): Promise<FlowResult> {
  const artifactsDir = await createRunArtifactsDir(flowName)
  logger.info('Lendo CSV de entrada', { csvPath })

  const requests = await readRequestsFromCsv(csvPath)
  const itemResults: CreateRequestResult[] = []

  for (const item of requests) {
    const result = await createRequest(browser, item, artifactsDir)
    itemResults.push(result)
  }

  const summary = buildSummary(itemResults)
  const outputPath = await writeRunOutput(flowName, {
    flow: flowName,
    taskName,
    sourceCsvPath: csvPath,
    summary,
    items: itemResults,
    finishedAt: new Date().toISOString(),
  })

  return {
    success: summary.failureCount === 0,
    artifactsDir,
    outputPath,
    summary,
    items: itemResults,
  }
}

async function main() {
  logger.info('Iniciando task RPA', { taskName })

  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
  })

  try {
    const result = await runBatch(browser)

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
    await browser.close()
  }
}

main()
