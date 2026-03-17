import path from 'node:path'
import { BrowserContext, Locator, Page } from 'playwright'

import { logger } from '../utils/logger'
import {
  CreateRequestAttemptInput,
  CreateRequestAttemptResult,
} from '../types/FlowRequest'

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

async function captureAttemptScreenshot(
  page: Page,
  artifactsDir: string,
  rowNumber: number,
  attempt: number,
  status: 'success' | 'error',
): Promise<string> {
  const rowToken = String(rowNumber).padStart(3, '0')
  const screenshotPath = path.join(
    artifactsDir,
    `row-${rowToken}-attempt-${attempt}-${status}.png`,
  )

  await page.screenshot({ path: screenshotPath, fullPage: true })
  return screenshotPath
}

async function captureAttemptScreenshotSafely(
  page: Page,
  artifactsDir: string,
  rowNumber: number,
  attempt: number,
  status: 'success' | 'error',
): Promise<string> {
  try {
    return await captureAttemptScreenshot(
      page,
      artifactsDir,
      rowNumber,
      attempt,
      status,
    )
  } catch (error) {
    logger.error('Falha ao capturar screenshot da tentativa', {
      rowNumber,
      attempt,
      status,
      error: error instanceof Error ? error.message : String(error),
    })
    return ''
  }
}

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
  context: BrowserContext,
  input: CreateRequestAttemptInput,
  artifactsDir: string,
): Promise<CreateRequestAttemptResult> {
  const { csvItem, attempt } = input
  let page: Page | undefined

  try {
    logger.info('Executando criação de request', {
      rowNumber: csvItem.rowNumber,
      attempt,
      title: csvItem.title,
    })

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
    const screenshotPath = await captureAttemptScreenshotSafely(
      page,
      artifactsDir,
      csvItem.rowNumber,
      attempt,
      isSuccess ? 'success' : 'error',
    )

    await page.close()

    return {
      rowNumber: csvItem.rowNumber,
      attempt,
      success: isSuccess,
      screenshotPath,
      feedbackText: feedbackResult.text,
      errorMessage: isSuccess ? undefined : feedbackResult.text,
    }
  } catch (error) {
    logger.error('Erro técnico ao criar request', {
      rowNumber: csvItem.rowNumber,
      attempt,
      error: error instanceof Error ? error.message : String(error),
    })

    let screenshotPath = ''
    if (page) {
      screenshotPath = await captureAttemptScreenshotSafely(
        page,
        artifactsDir,
        csvItem.rowNumber,
        attempt,
        'error',
      )
      await page.close()
    }

    return {
      rowNumber: csvItem.rowNumber,
      attempt,
      success: false,
      screenshotPath,
      feedbackText: '',
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}
