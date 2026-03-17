export interface RequestCsvItem {
  rowNumber: number
  title: string
  description: string
  priority: string
  status: string
  createdBy: string
}

export interface CreateRequestAttemptInput {
  csvItem: RequestCsvItem
  attempt: number
}

export interface CreateRequestAttemptResult {
  rowNumber: number
  attempt: number
  success: boolean
  screenshotPath: string
  feedbackText: string
  errorMessage?: string
}
