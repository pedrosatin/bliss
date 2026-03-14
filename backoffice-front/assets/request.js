import { isApiConfigured } from './config.js'
import { getRequestById } from './api.js'
import {
  bindEnvironmentSelect,
  getPriorityLabel,
  getStatusLabel,
  resetCustomApiOverride,
} from './ui.js'

const feedback = document.querySelector('#feedback')
const requestDetails = document.querySelector('#request-details')
const missingIdState = document.querySelector('#missing-id')
const pageTitle = document.querySelector('#page-title')

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

const setValue = (selector, value) => {
  const element = document.querySelector(selector)
  element.textContent = value || '-'
}

const formatDate = (value) => {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value))
}

const renderRequest = (request) => {
  pageTitle.textContent = request.title
  setValue('#detail-id', request.id)
  setValue('#detail-status', getStatusLabel(request.status))
  setValue('#detail-priority', getPriorityLabel(request.priority))
  setValue('#detail-created-by', request.createdBy)
  setValue('#detail-title', request.title)
  setValue('#detail-description', request.description)
  setValue('#detail-created-at', formatDate(request.createdAt))
  setValue('#detail-updated-at', formatDate(request.updatedAt))
  requestDetails.hidden = false
}

const loadRequest = async () => {
  const requestId = new URLSearchParams(window.location.search)
    .get('id')
    ?.trim()

  if (!requestId) {
    missingIdState.hidden = false
    pageTitle.textContent = 'ID não informado'
    return
  }

  if (!isApiConfigured) {
    pageTitle.textContent = 'API não configurada'
    setFeedback('Configure a URL da API em assets/config.js.', 'error')
    return
  }

  try {
    const { data, requestId: responseRequestId } =
      await getRequestById(requestId)
    renderRequest(data)

    if (responseRequestId) {
      setFeedback(`x-request-id: ${responseRequestId}`, 'info')
    }
  } catch (error) {
    pageTitle.textContent = 'Erro ao carregar request'
    setFeedback(error.message, 'error')
  }
}

bindEnvironmentSelect()
resetCustomApiOverride()

await loadRequest()
