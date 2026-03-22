interface LogPayload {
  [key: string]: unknown
}

export const logger = {
  info(message: string, payload?: LogPayload): void {
    console.log(
      `[INFO] ${message}${payload ? ` ${JSON.stringify(payload)}` : ''}`,
    )
  },
  error(message: string, payload?: LogPayload): void {
    console.error(
      `[ERROR] ${message}${payload ? ` ${JSON.stringify(payload)}` : ''}`,
    )
  },
}
