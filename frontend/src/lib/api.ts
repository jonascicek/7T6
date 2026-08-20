import axios from 'axios'

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()

// Normalize configured base URL and avoid trailing slash issues.
const baseURL = rawBaseUrl === '' ? '' : rawBaseUrl.replace(/\/+$/, '')

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 120000,
})

export default api
