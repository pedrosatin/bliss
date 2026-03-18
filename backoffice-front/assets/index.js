import { isApiConfigured } from './config.js'
import { listRequests } from './api.js'
import {
  bindEnvironmentSelect,
  getPriorityLabel,
  getPriorityTone,
  getStatusLabel,
  getStatusTone,
  resetCustomApiOverride,
} from './ui.js'

const filtersForm = document.querySelector('#filters-form')
const clearFiltersButton = document.querySelector('#clear-filters')
const tableBody = document.querySelector('#requests-table-body')
const emptyState = document.querySelector('#empty-state')
const feedback = document.querySelector('#feedback')
const resultsSummary = document.querySelector('#results-summary')
const previousPageButton = document.querySelector('#prev-page')
const nextPageButton = document.querySelector('#next-page')
const paginationSummary = document.querySelector('#pagination-summary')

const paginationState = {
  page: 1,
  currentToken: undefined,
  nextToken: undefined,
  previousTokens: [],
  limit: 10,
  isLoading: false,
}

const formatDate = (value) => {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

const setFeedback = (message, tone = 'info') => {
  feedback.hidden = !message

  if (!message) {
    feedback.textContent = ''
    feedback.className = 'feedback'
    return
  }

  feedback.textContent = message
  feedback.className = `feedback feedback-${tone}`
}

const setPaginationControls = () => {
  const canGoBack = paginationState.previousTokens.length > 0
  const canGoForward = Boolean(paginationState.nextToken)

  previousPageButton.disabled = paginationState.isLoading || !canGoBack
  nextPageButton.disabled = paginationState.isLoading || !canGoForward
  paginationSummary.textContent = `Página ${paginationState.page} · ${paginationState.limit} itens por página`
}

const renderRows = (requests) => {
  tableBody.innerHTML = ''

  requests.forEach((request) => {
    const row = document.createElement('tr')

    row.innerHTML = `
      <td>
        <code class="truncated-id" title="${request.id}">${request.id}</code>
      </td>
      <td>${request.title}</td>
      <td><span class="status-badge status-${getStatusTone(request.status)}">${getStatusLabel(request.status)}</span></td>
      <td><span class="priority-badge priority-${getPriorityTone(request.priority)}">${getPriorityLabel(request.priority)}</span></td>
      <td>${request.createdBy}</td>
      <td>${formatDate(request.updatedAt)}</td>
      <td><a href="./request.html?id=${encodeURIComponent(request.id)}">Detalhe</a></td>
    `

    tableBody.appendChild(row)
  })

  emptyState.hidden = requests.length > 0
}

const getFilters = () => {
  const formData = new FormData(filtersForm)

  return {
    createdBy: String(formData.get('createdBy') || '').trim(),
    status: String(formData.get('status') || '').trim(),
    limit: String(formData.get('limit') || '').trim() || '10',
  }
}

const normalizeListResponse = (data, fallbackLimit) => {
  if (Array.isArray(data)) {
    return {
      items: data,
      limit: fallbackLimit,
      nextToken: undefined,
    }
  }

  const items = Array.isArray(data?.items) ? data.items : []
  const parsedLimit = Number(data?.limit)

  return {
    items,
    limit:
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : fallbackLimit,
    nextToken:
      typeof data?.nextToken === 'string' && data.nextToken
        ? data.nextToken
        : undefined,
  }
}

const fetchAndRenderPage = async (token, page) => {
  if (!isApiConfigured) {
    resultsSummary.textContent = 'Configure a URL da API em assets/config.js.'
    emptyState.hidden = false
    setFeedback('Sem API configurada para este ambiente.', 'error')
    tableBody.innerHTML = ''
    paginationState.nextToken = undefined
    setPaginationControls()
    return null
  }

  const filters = getFilters()
  const fallbackLimit = Number(filters.limit) || 10

  resultsSummary.textContent = 'Carregando requests…'
  setFeedback('')
  paginationState.isLoading = true
  setPaginationControls()

  try {
    const { data, requestId } = await listRequests({
      ...filters,
      nextToken: token,
    })

    const normalizedResponse = normalizeListResponse(data, fallbackLimit)
    const requests = normalizedResponse.items

    resultsSummary.textContent = `${requests.length} request(s) encontrada(s) na página ${page}`
    renderRows(requests)

    if (requestId) {
      setFeedback(`Último x-request-id: ${requestId}`, 'info')
    }

    return normalizedResponse
  } catch (error) {
    tableBody.innerHTML = ''
    emptyState.hidden = false
    resultsSummary.textContent = 'Não foi possível carregar a lista.'
    setFeedback(error.message, 'error')
    return null
  } finally {
    paginationState.isLoading = false
    setPaginationControls()
  }
}

const resetPaginationState = () => {
  paginationState.page = 1
  paginationState.currentToken = undefined
  paginationState.nextToken = undefined
  paginationState.previousTokens = []
}

const loadFirstPage = async () => {
  resetPaginationState()

  const firstPageResponse = await fetchAndRenderPage(undefined, 1)

  if (!firstPageResponse) {
    return
  }

  paginationState.limit = firstPageResponse.limit
  paginationState.nextToken = firstPageResponse.nextToken
  setPaginationControls()
}

filtersForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  await loadFirstPage()
})

clearFiltersButton.addEventListener('click', async () => {
  filtersForm.reset()
  await loadFirstPage()
})

nextPageButton.addEventListener('click', async () => {
  if (!paginationState.nextToken || paginationState.isLoading) {
    return
  }

  const targetToken = paginationState.nextToken
  const targetPage = paginationState.page + 1
  const targetResponse = await fetchAndRenderPage(targetToken, targetPage)

  if (!targetResponse) {
    return
  }

  paginationState.previousTokens.push(paginationState.currentToken ?? '')
  paginationState.currentToken = targetToken
  paginationState.page = targetPage
  paginationState.limit = targetResponse.limit
  paginationState.nextToken = targetResponse.nextToken
  setPaginationControls()
})

previousPageButton.addEventListener('click', async () => {
  if (
    paginationState.previousTokens.length === 0 ||
    paginationState.isLoading
  ) {
    return
  }

  const previousTokenValue =
    paginationState.previousTokens[paginationState.previousTokens.length - 1]
  const previousToken = previousTokenValue || undefined
  const targetPage = Math.max(1, paginationState.page - 1)
  const targetResponse = await fetchAndRenderPage(previousToken, targetPage)

  if (!targetResponse) {
    return
  }

  paginationState.previousTokens.pop()
  paginationState.currentToken = previousToken
  paginationState.page = targetPage
  paginationState.limit = targetResponse.limit
  paginationState.nextToken = targetResponse.nextToken
  setPaginationControls()
})

bindEnvironmentSelect()
resetCustomApiOverride()
setPaginationControls()

await loadFirstPage()
