export interface RequestCsvItem {
  rowNumber: number
  title: string
  description: string
  priority: string
  status: string
  createdBy: string
}

export interface CreateRequestResult {
  rowNumber: number
  success: boolean
  screenshotPath?: string
  tracePath?: string
  feedbackText: string
  errorMessage?: string
  createdId?: string
}
