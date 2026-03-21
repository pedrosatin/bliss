import { readFile } from 'node:fs/promises'
// https://csv.js.org/parse/api/sync/#sync-api
import { parse } from 'csv-parse/sync'

import { RequestCsvItem } from '../types/FlowRequest'

const REQUIRED_COLUMNS: (keyof Omit<RequestCsvItem, 'rowNumber'>)[] = [
  'title',
  'description',
  'priority',
  'status',
  'createdBy',
]

const normalizeLineEndings = (content: string): string =>
  content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

export async function readRequestsFromCsv(
  filePath: string,
): Promise<RequestCsvItem[]> {
  const rawContent = await readFile(filePath, 'utf-8')
  const content = normalizeLineEndings(rawContent)
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[]

  if (records.length > 0) {
    const presentColumns = Object.keys(records[0])
    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !presentColumns.includes(col),
    )
    if (missingColumns.length > 0) {
      throw new Error(
        `CSV inválido — colunas obrigatórias ausentes: ${missingColumns.join(', ')}`,
      )
    }
  }

  const items = records.map((row, index) => ({
    rowNumber: index + 1,
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    priority: String(row.priority ?? ''),
    status: String(row.status ?? ''),
    createdBy: String(row.createdBy ?? ''),
  }))

  return items
}
