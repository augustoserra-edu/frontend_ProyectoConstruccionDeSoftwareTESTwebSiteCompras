import axios from 'axios'
import Swal from 'sweetalert2'
import { cerrarAviso } from '../utils/avisos'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://corralon.ordema.app/api'
).replace('https://corralon.ordema.app:8080', 'https://corralon.ordema.app')

export function manejarSesionExpirada(): void {
  localStorage.clear()
  sessionStorage.clear()

  if (Swal.isVisible()) {
    Swal.close()
  }
  cerrarAviso()

  window.dispatchEvent(new Event('auth:unauthorized'))
  window.location.href = '/login'
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 10000
})

// Adjunta el token de autenticación si existe en localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor global de respuestas para manejar sesión expirada o token inválido (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      manejarSesionExpirada()
    }
    return Promise.reject(error)
  }
)

export default api
