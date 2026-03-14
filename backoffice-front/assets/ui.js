import {
  API_ENVIRONMENT,
  API_SOURCE_LABEL,
  API_URL_STORAGE_KEY,
  setApiEnvironment,
} from './config.js'

export const STATUS_LABELS = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Andamento',
  CLOSED: 'Fechado',
}

export const PRIORITY_LABELS = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
}

export const getStatusLabel = (status) => {
  if (!status) {
    return '-'
  }

  return STATUS_LABELS[status] || status
}

export const getPriorityLabel = (priority) => {
  if (!priority) {
    return '-'
  }

  return PRIORITY_LABELS[priority] || priority
}

export const getStatusTone = (status) => {
  if (status === 'CLOSED') {
    return 'success'
  }

  if (status === 'IN_PROGRESS') {
    return 'warning'
  }

  return 'info'
}

export const getPriorityTone = (priority) => {
  if (priority === 'HIGH') {
    return 'danger'
  }

  if (priority === 'MEDIUM') {
    return 'warning'
  }

  return 'neutral'
}

export const bindEnvironmentSelect = () => {
  const environmentSelect = document.querySelector('[data-api-environment]')
  const environmentLabel = document.querySelector('[data-api-source-label]')

  if (environmentSelect) {
    environmentSelect.value =
      API_ENVIRONMENT === 'local' || API_ENVIRONMENT === 'prod'
        ? API_ENVIRONMENT
        : 'prod'

    environmentSelect.addEventListener('change', () => {
      setApiEnvironment(environmentSelect.value)
      window.location.reload()
    })
  }

  if (environmentLabel) {
    if (API_ENVIRONMENT === 'custom') {
      environmentLabel.hidden = false
      environmentLabel.textContent = `Override ativo: ${API_SOURCE_LABEL} via localStorage`
    } else {
      environmentLabel.hidden = true
      environmentLabel.textContent = ''
    }
  }
}

export const resetCustomApiOverride = () => {
  const resetButton = document.querySelector('[data-reset-api-override]')

  if (!resetButton) {
    return
  }

  if (API_ENVIRONMENT !== 'custom') {
    resetButton.hidden = true
    return
  }

  resetButton.hidden = false
  resetButton.addEventListener('click', () => {
    window.localStorage.removeItem(API_URL_STORAGE_KEY)
    setApiEnvironment('prod')
    window.location.reload()
  })
}
