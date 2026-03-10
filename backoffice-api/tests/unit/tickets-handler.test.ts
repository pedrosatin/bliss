import { describe, expect, it } from 'vitest'
import { handleGetAll } from '../../src/handlers/tickets-handler'

describe('handleGetAll', () => {
  it('returns the hello world payload', async () => {
    const response = await handleGetAll({} as never, {} as never)

    expect(response.statusCode).toBe(200)
    expect(response.headers).toEqual({
      'Content-Type': 'application/json',
    })
    expect(response.body).toBe(JSON.stringify('Hello World'))
  })
})
