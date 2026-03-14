import { API_BASE_URL, isApiConfigured } from './config.js'

const normalizeBaseUrl = () => API_BASE_URL.replace(/\/$/, '')

const getRequestsBaseUrl = () => {
  const normalizedBaseUrl = normalizeBaseUrl()

  if (/\/requests$/i.test(normalizedBaseUrl)) {
    return normalizedBaseUrl
  }

  return `${normalizedBaseUrl}/requests`
}

const buildUrl = (path = '', query = {}) => {
  if (!isApiConfigured) {
    throw new Error(
      'Configure a API em assets/config.js antes de usar o front.',
    )
  }

  const requestsBaseUrl = getRequestsBaseUrl()
  const normalizedPath = path ? `/${path.replace(/^\//, '')}` : ''
  const url = new URL(`${requestsBaseUrl}${normalizedPath}`)

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

const parseResponseBody = async (response) => {
  const responseText = await response.text()

  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText)
  } catch {
    return responseText
  }
}

const request = async (path, options = {}, query = {}) => {
  const response = await fetch(buildUrl(path, query), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  const data = await parseResponseBody(response)
  const requestId = response.headers.get('x-request-id')

  if (!response.ok) {
    const errorMessage =
      typeof data === 'object' && data?.error
        ? data.error
        : `Erro HTTP ${response.status}`

    const error = new Error(errorMessage)
    error.statusCode = response.status
    error.requestId = requestId
    throw error
  }

  return { data, requestId }
}

export const listRequests = async (filters = {}) => {
  return request('', { method: 'GET' }, filters)
}

export const getRequestById = async (requestId) => {
  return request(encodeURIComponent(requestId), { method: 'GET' })
}

export const createRequest = async (payload) => {
  return request('', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
