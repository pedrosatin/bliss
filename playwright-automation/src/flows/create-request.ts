import path from 'node:path'
import { Browser, BrowserContext, Locator, Page } from 'playwright'

import { logger } from '../utils/logger'
import { CreateRequestResult, RequestCsvItem } from '../types/FlowRequest'

// Constants

const DEFAULT_CREATE_URL =
  process.env.BLISS_FRONT_CREATE_URL ??
  'https://bliss-front.pedrosatin.com/create.html'

const FEEDBACK_TIMEOUT_MS = 5_000

// Queries

const getTitleInput = (page: Page): Locator => page.getByLabel(/título/i)
const getDescriptionInput = (page: Page): Locator =>
  page.getByLabel(/descrição/i)
const getPrioritySelect = (page: Page): Locator =>
  page.getByLabel(/prioridade/i)
const getStatusSelect = (page: Page): Locator =>
  page.getByLabel(/status inicial/i)
const getCreatedByInput = (page: Page): Locator =>
  page.getByLabel(/email do criador/i)
const getSubmitButton = (page: Page): Locator =>
  page.getByRole('button', { name: /criar request/i })
const getFeedback = (page: Page): Locator => page.locator('#feedback')
const getPageHeading = (page: Page): Locator =>
  page.getByRole('heading', { name: /nova request/i })

// Helpers


async function readFeedback(
  feedback: Locator,
): Promise<{ text: string; className: string }> {
  const text = (await feedback.textContent())?.trim() ?? ''
  const className = (await feedback.getAttribute('class')) ?? ''
  return {
    text,
    className,
  }
}

// Main flow function

export async function createRequest(
  browser: Browser,
  csvItem: RequestCsvItem,
  artifactsDir: string,
): Promise<CreateRequestResult> {
  const context: BrowserContext = await browser.newContext()
  const screenshotPath = path.join(
    artifactsDir,
    `row-${csvItem.rowNumber}-success.png`,
  )
  const tracePath = path.join(
    artifactsDir,
    `row-${csvItem.rowNumber}-failure-trace.zip`,
  )

  let page: Page | undefined
  let traceStarted = false

  let result: CreateRequestResult = {
    rowNumber: csvItem.rowNumber,
    success: false,
    feedbackText: '',
  }

  try {
    logger.info(`Executando criação de request em ${DEFAULT_CREATE_URL}`, {
      rowNumber: csvItem.rowNumber,
      title: csvItem.title,
    })

    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    })
    traceStarted = true

    page = await context.newPage()
    await page.goto(DEFAULT_CREATE_URL, { waitUntil: 'domcontentloaded' })

    const titleInput = getTitleInput(page)
    const descriptionInput = getDescriptionInput(page)
    const prioritySelect = getPrioritySelect(page)
    const statusSelect = getStatusSelect(page)
    const createdByInput = getCreatedByInput(page)
    const submitButton = getSubmitButton(page)
    const feedback = getFeedback(page)
    const pageHeading = getPageHeading(page)

    await pageHeading.waitFor({
      state: 'visible',
      timeout: FEEDBACK_TIMEOUT_MS,
    })
    await titleInput.fill(csvItem.title)
    await descriptionInput.fill(csvItem.description)
    await prioritySelect.selectOption(csvItem.priority)
    await statusSelect.selectOption(csvItem.status)
    await createdByInput.fill(csvItem.createdBy)

    await Promise.all([
      feedback.waitFor({ state: 'visible', timeout: FEEDBACK_TIMEOUT_MS }),
      submitButton.click(),
    ])

    const feedbackResult = await readFeedback(feedback)
    const isSuccess = feedbackResult.className.includes('success')

    let capturedScreenshotPath: string | undefined
    if (isSuccess) {
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true })
        capturedScreenshotPath = screenshotPath
      } catch (error) {
        logger.error('Falha ao capturar screenshot de sucesso', {
          rowNumber: csvItem.rowNumber,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    result = {
      rowNumber: csvItem.rowNumber,
      success: isSuccess,
      screenshotPath: capturedScreenshotPath,
      feedbackText: feedbackResult.text,
      errorMessage: isSuccess ? undefined : feedbackResult.text,
    }
  } catch (error) {
    logger.error('Erro técnico ao criar request', {
      rowNumber: csvItem.rowNumber,
      error: error instanceof Error ? error.message : String(error),
    })

    result = {
      rowNumber: csvItem.rowNumber,
      success: false,
      feedbackText: '',
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  } finally {
    if (traceStarted) {
      try {
        if (result.success) {
          await context.tracing.stop()
        } else {
          await context.tracing.stop({ path: tracePath })
          result.tracePath = tracePath
        }
      } catch (error) {
        logger.error('Falha ao salvar trace do fluxo', {
          rowNumber: csvItem.rowNumber,
          tracePath,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    try {
      await context.close()
    } catch (error) {
      logger.error('Falha ao fechar contexto do fluxo', {
        rowNumber: csvItem.rowNumber,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return result
}
