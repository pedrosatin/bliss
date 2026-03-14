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
  }
}

const loadRequests = async () => {
  if (!isApiConfigured) {
    resultsSummary.textContent = 'Configure a URL da API em assets/config.js.'
    emptyState.hidden = false
    setFeedback('Sem API configurada para este ambiente.', 'error')
    tableBody.innerHTML = ''
    return
  }

  const filters = getFilters()

  resultsSummary.textContent = 'Carregando requests…'
  setFeedback('')

  try {
    const { data, requestId } = await listRequests(filters)
    const requests = Array.isArray(data) ? data : []

    resultsSummary.textContent = `${requests.length} request(s) encontrada(s)`
    renderRows(requests)

    if (requestId) {
      setFeedback(`Último x-request-id: ${requestId}`, 'info')
    }
  } catch (error) {
    tableBody.innerHTML = ''
    emptyState.hidden = false
    resultsSummary.textContent = 'Não foi possível carregar a lista.'
    setFeedback(error.message, 'error')
  }
}

filtersForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  await loadRequests()
})

clearFiltersButton.addEventListener('click', async () => {
  filtersForm.reset()
  await loadRequests()
})

bindEnvironmentSelect()
resetCustomApiOverride()

await loadRequests()
