const LOCAL_API_BASE_URL = 'http://localhost:3000'
const DEPLOY_API_BASE_URL = 'https://bliss-api.pedrosatin.com/requests/'

export const API_URL_STORAGE_KEY = 'bliss.frontend.apiBaseUrl'
export const API_ENVIRONMENTS = {
  local: {
    label: 'Local',
    url: LOCAL_API_BASE_URL,
  },
  prod: {
    label: 'Produção',
    url: DEPLOY_API_BASE_URL,
  },
}

const normalizeStorageValue = (value) => value?.trim() || ''

const readStorageOverride = () => {
  const rawValue = normalizeStorageValue(
    window.localStorage.getItem(API_URL_STORAGE_KEY),
  )

  if (!rawValue) {
    return null
  }

  if (rawValue === 'local') {
    return {
      mode: 'local',
      value: API_ENVIRONMENTS.local.url,
      sourceLabel: API_ENVIRONMENTS.local.label,
    }
  }

  if (rawValue === 'deploy' || rawValue === 'prod') {
    return {
      mode: 'prod',
      value: API_ENVIRONMENTS.prod.url,
      sourceLabel: API_ENVIRONMENTS.prod.label,
    }
  }

  return {
    mode: 'custom',
    value: rawValue,
    sourceLabel: 'Customizada',
  }
}

const storageOverride = readStorageOverride()
const defaultEnvironment =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? API_ENVIRONMENTS.local
    : API_ENVIRONMENTS.prod

export const API_BASE_URL = (
  storageOverride?.value || defaultEnvironment.url
).trim()

export const API_ENVIRONMENT =
  storageOverride?.mode ||
  (defaultEnvironment === API_ENVIRONMENTS.local ? 'local' : 'prod')

export const API_SOURCE_LABEL = storageOverride
  ? storageOverride.sourceLabel
  : defaultEnvironment.label

export const isApiConfigured = API_BASE_URL.length > 0

export const setApiEnvironment = (mode) => {
  if (mode === 'local') {
    window.localStorage.setItem(API_URL_STORAGE_KEY, 'local')
    return
  }

  if (mode === 'prod') {
    window.localStorage.setItem(API_URL_STORAGE_KEY, 'prod')
    return
  }

  window.localStorage.removeItem(API_URL_STORAGE_KEY)
}
