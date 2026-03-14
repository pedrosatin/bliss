import { isApiConfigured } from './config.js'
import { createRequest } from './api.js'
import { bindEnvironmentSelect, resetCustomApiOverride } from './ui.js'

const createForm = document.querySelector('#create-form')
const feedback = document.querySelector('#feedback')
const submitButton = document.querySelector('#submit-button')

const setFeedback = (message, tone = 'info') => {
  feedback.hidden = !message

  if (!message) {
    feedback.textContent = ''
    feedback.className = 'feedback'
    return
  }

  feedback.innerHTML = message
  feedback.className = `feedback feedback-${tone}`
}

const getPayload = () => {
  const formData = new FormData(createForm)
  const description = String(formData.get('description') || '').trim()
  const status = String(formData.get('status') || '').trim()

  const payload = {
    title: String(formData.get('title') || '').trim(),
    priority: String(formData.get('priority') || '').trim(),
    createdBy: String(formData.get('createdBy') || '').trim(),
  }

  if (description) {
    payload.description = description
  }

  if (status) {
    payload.status = status
  }

  return payload
}

createForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  if (!isApiConfigured) {
    setFeedback('Configure a URL da API em assets/config.js.', 'error')
    return
  }

  submitButton.disabled = true
  submitButton.textContent = 'Criando…'
  setFeedback('')

  try {
    const payload = getPayload()
    const { data, requestId } = await createRequest(payload)

    createForm.reset()

    setFeedback(
      `Request criada com sucesso. <a href="./request.html?id=${encodeURIComponent(
        data.id,
      )}">Abrir detalhe</a>${requestId ? ` · x-request-id: ${requestId}` : ''}`,
      'success',
    )
  } catch (error) {
    setFeedback(error.message, 'error')
  } finally {
    submitButton.disabled = false
    submitButton.textContent = 'Criar request'
  }
})

bindEnvironmentSelect()
resetCustomApiOverride()
