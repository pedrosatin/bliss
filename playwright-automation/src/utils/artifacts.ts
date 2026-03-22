import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// All artifacts and outputs for a single run are stored together in one directory.
// Could be sent to S3 and/or database in a real implementation.
const DEFAULT_RUNS_DIR = path.resolve(process.cwd(), 'runs')

const generateToken = () => new Date().toISOString().replace(/[:.]/g, '-')

export async function createRunDir(prefix: string): Promise<string> {
  const runDir = path.join(DEFAULT_RUNS_DIR, `${prefix}-${generateToken()}`)
  await mkdir(runDir, { recursive: true })
  return runDir
}

export async function writeRunOutput(
  runDir: string,
  data: unknown,
): Promise<string> {
  const outputPath = path.join(runDir, 'result.json')
  await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8')
  return outputPath
}
