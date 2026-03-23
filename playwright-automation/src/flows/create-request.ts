import path from 'node:path'
import { Browser, BrowserContext, Page } from 'playwright'

import { logger } from '../utils/logger'
import { CreateRequestResult, RequestCsvItem } from '../types/FlowRequest'

// Constants

const DEFAULT_URL = process.env.BLISS_FRONT_URL ?? 'http://localhost:4173'
const DEFAULT_CREATE_URL = `${DEFAULT_URL}/create.html`

const FEEDBACK_TIMEOUT_MS = 5_000

// Page Objects

function createRequestPage(page: Page) {
  const feedback = page.locator('#feedback')

  return {
    goto: () => page.goto(DEFAULT_CREATE_URL, { waitUntil: 'domcontentloaded' }),

    waitForLoad: () =>
      page
        .getByRole('heading', { name: /nova request/i })
        .waitFor({ state: 'visible', timeout: FEEDBACK_TIMEOUT_MS }),

    fillForm: async (item: RequestCsvItem) => {
      await page.getByLabel(/título/i).fill(item.title)
      await page.getByLabel(/descrição/i).fill(item.description)
      await page.getByLabel(/prioridade/i).selectOption(item.priority)
      await page.getByLabel(/status inicial/i).selectOption(item.status)
      await page.getByLabel(/email do criador/i).fill(item.createdBy)
    },

    submit: () =>
      page.getByRole('button', { name: /criar request/i }).click(),

    waitForFeedback: () =>
      feedback.waitFor({ state: 'visible', timeout: FEEDBACK_TIMEOUT_MS }),

    readFeedback: async (): Promise<{ text: string; className: string }> => ({
      text: (await feedback.textContent())?.trim() ?? '',
      className: (await feedback.getAttribute('class')) ?? '',
    }),

    getCreatedId: async (): Promise<string | undefined> => {
      const href = await feedback.locator('a').getAttribute('href')
      return href
        ? (new URLSearchParams(href.split('?')[1]).get('id') ?? undefined)
        : undefined
    },
  }
}

function requestDetailPage(page: Page) {
  return {
    goto: (id: string) =>
      page.goto(`${DEFAULT_URL}/request.html?id=${id}`, {
        waitUntil: 'domcontentloaded',
      }),

    waitForData: () =>
      page.waitForFunction(
        () => {
          const text =
            document.querySelector('#detail-id')?.textContent?.trim() ?? ''
          return text !== '' && text !== '-'
        },
        { timeout: FEEDBACK_TIMEOUT_MS },
      ),

    screenshot: (screenshotPath: string) =>
      page.screenshot({ path: screenshotPath, fullPage: true }),
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
    const form = createRequestPage(page)

    await form.goto()
    await form.waitForLoad()
    await form.fillForm(csvItem)
    await Promise.all([form.waitForFeedback(), form.submit()])

    const feedbackResult = await form.readFeedback()
    const isSuccess = feedbackResult.className.includes('success')

    let capturedScreenshotPath: string | undefined
    let createdId: string | undefined

    if (isSuccess) {
      createdId = await form.getCreatedId()

      try {
        const detail = requestDetailPage(page)
        if (createdId) {
          await detail.goto(createdId)
          await detail.waitForData()
        }
        await detail.screenshot(screenshotPath)
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
      createdId,
    }
  } catch (error) {
    logger.error('Erro técnico ao criar request', {
      rowNumber: csvItem.rowNumber,
      error: error instanceof Error ? error.message : String(error),
    })

    const ANSI_RE = /\x1b\[[0-9;]*m/g
    result = {
      rowNumber: csvItem.rowNumber,
      success: false,
      feedbackText: '',
      errorMessage: (error instanceof Error ? error.message : String(error))
        .replace(ANSI_RE, '')
        .replace(/\\n/g, '\n')
        .trim(),
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
