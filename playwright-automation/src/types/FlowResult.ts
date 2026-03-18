import { CreateRequestResult } from './FlowRequest'

export interface FlowSummary {
  total: number
  successCount: number
  failureCount: number
}

export interface FlowResult {
  success: boolean
  artifactsDir: string
  outputPath: string
  summary: FlowSummary
  items: CreateRequestResult[]
  error?: Error
}
