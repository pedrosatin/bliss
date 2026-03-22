import { CreateRequestResult } from './FlowRequest'

export interface FlowSummary {
  total: number
  successCount: number
  failureCount: number
}

export interface FlowResult {
  success: boolean
  runDir: string
  summary: FlowSummary
  items: CreateRequestResult[]
  error?: Error
}
