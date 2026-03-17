import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Paths inside root directory for storing artifacts and outputs
// Could be sent to S3 and/or database in a real implementation
const DEFAULT_ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts')
const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), 'output')

const generateToken = () => new Date().toISOString().replace(/[:.]/g, '-')

export async function createRunArtifactsDir(prefix: string): Promise<string> {
  const runDir = path.join(
    DEFAULT_ARTIFACTS_DIR,
    `${prefix}-${generateToken()}`,
  )
  await mkdir(runDir, { recursive: true })
  return runDir
}

export async function writeRunOutput(
  prefix: string,
  data: unknown,
): Promise<string> {
  await mkdir(DEFAULT_OUTPUT_DIR, { recursive: true })

  const outputPath = path.join(
    DEFAULT_OUTPUT_DIR,
    `${prefix}-${generateToken()}.json`,
  )

  await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8')
  return outputPath
}
